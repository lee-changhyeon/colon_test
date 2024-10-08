const fs = require('fs');
const path = require('path');
const dayjs = require('dayjs');

const dotenv = require('dotenv');
dotenv.config();

const db = require('./db');
const { Study, Current, Waiting } = require('./db');
const { error } = require('console');

const savePath = process.env.SAVE_PATH;


const convertProcess = (savePath, patientId, studyDate, birthdate, age, sex) => {
    return new Promise((resolve, reject) => {
        const process = spawn('python', [path.join(__dirname, 'dicom_to_jpg.py'), savePath, patientId, studyDate, birthdate, age, sex]);

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

const calculateAge = (birthdate, studyDate) => {
    const birth = dayjs(birthdate, 'YYYY-MM-DD');
    const study = dayjs(studyDate, 'YYYY-MM-DD');
    return study.diff(birth, 'year') - (study.isBefore(birth.add(study.diff(birth, 'year'), 'year')) ? 1 : 0);
};

// dayjs를 사용하여 날짜를 반복하는 함수 추가
const getDatesBetween = (startDate, endDate) => {
    const dates = [];
    let currentDate = dayjs(startDate, 'YYYYMMDD'); // 형식 지정
    const end = dayjs(endDate, 'YYYYMMDD'); // 형식 지정

    // 현재 날짜가 끝 날짜보다 크거나 같을 때까지 반복
    while (currentDate.isAfter(end) || currentDate.isSame(end)) {
        dates.push(currentDate.format('YYYYMMDD')); // YYYY-MM-DD 형식으로 변환
        currentDate = currentDate.subtract(1, 'day'); // 하루씩 감소
    }
    return dates;
};


const start = async (startDate, endDate) => {
    try {
        await new Promise((resolve, reject) => {
            db.sequelize
                .sync({ alter: false })
                .then(async () => {
                    console.log('mysql connect success');
                    resolve(true);
                })
                .catch((err) => {
                    console.log(err);
                    reject(false);
                });
        });

        const dates = getDatesBetween(startDate, endDate);
        for (const date of dates) {
            const studyData = await Study.findAll({ where: { study_date: date } });
            for (const study of studyData) {
                const year = study.study_date.split('-')[0];
                const month = study.study_date.split('-')[1];
                const date = study.study_date.split('-')[2];
                const patientId = study.patient_id;
                const studyDate = dayjs(study.study_date).format('YYYYMMDD');
                const birthdate = dayjs(study.patient_birthdate).format('YYYYMMDD');
                const age = String(calculateAge(study.patient_birthdate, study.study_date));
                const sex = study.patient_sex;
                const datePath = path.join(savePath, year, month, date, `${study.patient_id}`);

                if (!fs.existsSync(datePath)) {
                    const dcmPath = path.join(savePath, year, month, date, `${String(study.id)}`);
                    if (!fs.existsSync(dcmPath)) { console.log('폴더 자체가 생성되지 않았음'); }
                    fs.mkdirSync(datePath, { recursive: true });
                    const pythonResult = await convertProcess(dcmPath, datePath, patientId, studyDate, birthdate, age, sex);
                    if (pythonResult.includes('Success')) {
                        fs.readdirSync(dcmPath).length === 0 && fs.rmdirSync(dcmPath);
                        await Study.update({ is_convert: true }, { where: { id: study.id } });
                    }
                }


                const files = fs.readdirSync(datePath);
                for (const file of files) {
                    const filePatientId = file.split('.')[0].split('_')[0];
                    const fileStudyDate = file.split('.')[0].split('_')[1];
                    const fileNumber = file.split('.')[0].split('_')[2];

                    if (filePatientId !== patientId || !studyDate.includes(fileStudyDate)) {
                        console.log('파일명이 불일치합니다.');
                    } else {
                        const oldPath = path.join(datePath, file);
                        const newFileName = `${patientId}_${studyDate}_${birthdate}_${age}_${sex}_${fileNumber}.jpg`; // 새로운 파일 이름 생성
                        const newPath = path.join(datePath, newFileName);
                        fs.renameSync(oldPath, newPath); // 파일 이름 변경
                    }
                }

            }
        }






        // const studyData = await Study.findAll({});



    } catch (error) {
        console.log('에러발생', error.message);
    }
}

start('20240927', '20240701');