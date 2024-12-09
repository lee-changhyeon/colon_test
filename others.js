
const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');
const dotenv = require('dotenv');
const { spawn } = require('child_process');
dotenv.config();

const inputPath = process.env.INPUT_PATH;
const savePath = process.env.SAVE_PATH;

// dicom
const { myAddress, cmoveAddress, } = require('./config');
const cmove = require('./dicom/cmove');
const dcmjsDimse = require('dcmjs-dimse');
const DcmjsDimseScp = require('./dicom/scp');
const { Server } = dcmjsDimse;
const server = new Server(DcmjsDimseScp);
const verbose = process.env.VERBOSE;

// db
const db = require('./db');
const { Study, Error } = require('./db');


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

        let isNotCmoveList = await Study.findAll({where:{is_convert:0, is_error:0}});
        while(isNotCmoveList.length){
            const studyData = isNotCmoveList[0];
            await cmoveProcess(studyData);
            const year = studyData.study_date.split('-')[0];
            const month = studyData.study_date.split('-')[1];
            const date = studyData.study_date.split('-')[2];
            const datePath = path.join(savePath, year, month, date, `${studyData.patient_id}`);
            if (!fs.existsSync(datePath)) { fs.mkdirSync(datePath, { recursive: true }) }
        
            const patientId = studyData.patient_id;
            const studyDate = dayjs(studyData.study_date).format('YYYYMMDD');
            const birthdate = dayjs(studyData.patient_birthdate).format('YYYYMMDD');
            const age = calculateAge(studyData.patient_birthdate, studyData.study_date);
            const sex = studyData.patient_sex;

            const pythonResult = await convertProcess(inputPath, datePath, patientId, studyDate, birthdate, age, sex);
            if (pythonResult.includes('Success')) {
                await Study.update({ is_convert: true }, { where: { id: studyData.id } });
            } else {
                await Study.update({ is_convert: false, is_error: true }, { where: { id: studyData.id } });
                const [errorRecord, created] = await Error.findOrCreate({
                    where: { study_instance_uid: studyData.study_instance_uid }, // study_id로 레코드를 찾거나 새로 생성
                    defaults: {  // 레코드가 없으면 이 데이터를 새로 추가
                      study_id:studyData.id,
                      patient_id: studyData.patient_id,
                      study_date: studyData.study_date,
                      reason: pythonResult,
                    }
                  });
                const files = fs.readdirSync(inputPath);
                for (const file of files) {
                    const sourcePath = path.join(inputPath, file);
                    const destinationPath = path.join(datePath, file);
                    fs.copyFileSync(sourcePath, destinationPath);
                    fs.unlinkSync(sourcePath);
                }

                console.log('error', studyData.id, pythonResult)
            }
            isNotCmoveList = await Study.findAll({where:{is_convert:0, is_error:0}});

        }
    } catch (error) {
        console.error(error);
    }
};

const calculateAge = (birthdate, studyDate) => {
    const birth = dayjs(birthdate, 'YYYY-MM-DD');
    const study = dayjs(studyDate, 'YYYY-MM-DD');
    return study.diff(birth, 'year') - (study.isBefore(birth.add(study.diff(birth, 'year'), 'year')) ? 1 : 0);
};


const cmoveProcess = async (studyData) => {
    const data = { QueryRetrieveLevel: 'STUDY', StudyInstanceUID: studyData.study_instance_uid };
    const cmoveResult = await cmove(myAddress, cmoveAddress, myAddress, data, inputPath, verbose);
    if (cmoveResult.includes('Success')) {
        await Study.update({ is_cmove: true }, { where: { id: studyData.id } });
    } else {
        // error Data에 삽입
        await Study.update({ is_error: true }, { where: { id: studyData.id } });
        const [errorRecord, created] = await Error.findOrCreate({
            where: { study_instance_uid: studyData.study_instance_uid }, // study_id로 레코드를 찾거나 새로 생성
            defaults: {  // 레코드가 없으면 이 데이터를 새로 추가
              study_id:studyData.id,
              patient_id: studyData.patient_id,
              study_date: studyData.study_date,
              reason: cmoveResult,
            }
          });
        console.log(`error: id: ${studyData.id}  - ${cmoveResult}`);
    }
    return;
};

const convertProcess = (inputPath, savePath, patientId, studyDate, birthdate, age, sex) => {
    return new Promise((resolve, reject) => {
        const process = spawn('python3', [path.join(__dirname, 'dicom_to_jpg.py'), inputPath, savePath, patientId, studyDate, birthdate, age, sex]);

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



