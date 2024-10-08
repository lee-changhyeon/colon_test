
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
dotenv.config();

const inputPath = process.env.INPUT_PATH;
const savePath = process.env.SAVE_PATH;
const startDate = process.env.START_DATE;
const endDate = process.env.END_DATE;

// dicom
const { myAddress, cfindAddress, cmoveAddress, cfindFilter } = require('./config');
const cfind = require('./dicom/cfind');
const cmove = require('./dicom/cmove');
const dcmjsDimse = require('dcmjs-dimse');
const DcmjsDimseScp = require('./dicom/scp');
const { Server } = dcmjsDimse;
const server = new Server(DcmjsDimseScp);
const verbose = process.env.VERBOSE;

// db
const db = require('./db');
const { Study, Current, Waiting } = require('./db');


const start = async () => {
    try {
        fs.mkdirSync(inputPath, { recursive: true });
        // mysql db connection
        await new Promise((resolve, reject) => {
            db.sequelize
                .sync({ alter: true })
                .then(async () => {
                    console.log('mysql connect success');
                    resolve(true);
                })
                .catch((err) => {
                    console.log(err);
                    reject(false);
                });
        });
        server.listen(myAddress.port);

        let currentDate = await findOneCurrentDate();
        while (new Date(dayjs(currentDate).format('YYYY-MM-DD')) >= new Date(dayjs(endDate).format('YYYY-MM-DD'))) {
            console.log(`${currentDate} working`);
            const cfindCount = await cfindProcess(currentDate);
            console.log(`${currentDate}의 cfind 내시경 건수 : ${cfindCount}`);

            let waitingList = await Waiting.findAll({});
            while (waitingList.length) {
                const waiting = waitingList[0]
                await cmoveProcess(waiting);
                const year = waiting.study_date.split('-')[0];
                const month = waiting.study_date.split('-')[1];
                const date = waiting.study_date.split('-')[2];
                const datePath = path.join(savePath, year, month, date, `${waiting.patient_id}`);
                if (!fs.existsSync(datePath)) { fs.mkdirSync(datePath, { recursive: true }) }
                const pythonResult = await convertProcess(datePath, waiting.patient_id, dayjs(waiting.study_date).format('YYMMDD'));
                if (pythonResult.includes('Success')) {
                    await Study.update({ is_convert: true }, { where: { id: waiting.study_id } });
                    await Waiting.destroy({ where: { id: waiting.id } });
                } else {
                    const files = fs.readdirSync(inputPath);
                    for (const file of files) {
                        const sourcePath = path.join(inputPath, file);
                        const destinationPath = path.join(datePath, file);
                        fs.copyFileSync(sourcePath, destinationPath);
                        fs.unlinkSync(sourcePath);
                    }
                    await Waiting.destroy({ where: { id: waiting.id } });
                }
                waitingList = await Waiting.findAll({});
            }
            const nextDate = dayjs(currentDate).subtract(1, 'day').format('YYYYMMDD');
            currentDate = await updateCurrentDate(nextDate);
        }
    } catch (error) {
        console.error(error);
    }
};

const updateCurrentDate = async (currentDate) => {
    const currentData = await Current.findOne({ where: { id: 1 } });
    currentData.current_date = currentDate;
    await currentData.save();
    return dayjs(currentData.current_date).format('YYYYMMDD');
}



const findOneCurrentDate = async () => {
    const [currentData, _] = await Current.findOrCreate({
        where: { id: 1 },
        defaults: { current_date: startDate },
        raw: false
    });
    return dayjs(currentData.current_date).format('YYYYMMDD');
};

const cmoveProcess = async (waiting) => {
    const data = { QueryRetrieveLevel: 'STUDY', StudyInstanceUID: waiting.study_instance_uid };
    const cmoveResult = await cmove(myAddress, cmoveAddress, myAddress, data, inputPath, verbose);
    if (cmoveResult.includes('Success')) {
        await Study.update({ is_cmove: true }, { where: { id: waiting.study_id } });
    } else {
        // error Data에 삽입
        await Waiting.destroy({ where: { id: waiting.id } });
    }
    return;
};

const cfindProcess = async (studyDate) => {
    await Current.findOrCreate({
        where: { id: 1 },
        defaults: { current_date: startDate },
        raw: false
    });

    const data = { QueryRetrieveLevel: 'STUDY', startDate: studyDate, ModalitiesInStudy: 'ES' }; //StudyInstanceUID, Modality: 'ES'
    const cfindResult = await cfind(myAddress, cfindAddress, data, cfindFilter, verbose);
    const count = cfindResult ? cfindResult.length : 0;
    if (cfindResult) {
        for (const study of cfindResult) {
            if(!study.PatientID){continue;}
            const [studyData, _] = await Study.findOrCreate({
                where: { study_instance_uid: study.StudyInstanceUID },
                defaults: {
                    study_date: study.StudyDate,
                    patient_id: study.PatientID,
                    patient_name: study.PatientName,
                    patient_birthdate: study.PatientBirthDate,
                    patient_sex: study.PatientSex,
                    study_description: study.StudyDescription
                }
            });

            if (!studyData.is_cmove) {
                const [waitingData, _] = await Waiting.findOrCreate({
                    where: { study_id: studyData.id },
                    defaults: {
                        study_instance_uid: studyData.study_instance_uid,
                        patient_id: studyData.patient_id,
                        study_date: studyData.study_date
                    }
                });
            }
        }
    }

    return count;
}

const convertProcess = (savePath, patientId, studyDate) => {
    return new Promise((resolve, reject) => {
        const process = spawn('python3', [path.join(__dirname, 'dicom_to_jpg.py'), savePath, patientId, studyDate]);

        let output = '';
        let errorOutput = '';

        // 표준 출력 처리
        process.stdout.on('data', (data) => {
            output += data.toString();
        });

        // 표준 오류 처리
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });

        // 프로세스 종료 시 처리
        process.on('close', (code) => {
            if (code !== 0) {
                resolve(`Error: ${errorOutput}`);
            } else {
                resolve(output);
            }
        });
    });
};

start();



