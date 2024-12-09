const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');
const dotenv = require('dotenv');
dotenv.config();

const { Op } = require('sequelize');


// db
const db = require('./db');
const { Study } = require('./db');


function inputExcel(excelFile) {
    // Excel 파일 경로 지정
    const filePath = path.join(__dirname, excelFile); //'result2.xlsx'
    const excel = XLSX.readFile(filePath);
    const sheetName = excel.SheetNames[0]; // 첫 번째 시트 선택
    const worksheet = excel.Sheets[sheetName];
    let excelData = XLSX.utils.sheet_to_json(worksheet);
    excelData = excelData.map((sheet) => {
        sheet.date = dayjs(sheet['날짜'], 'MM/DD/YYYY HH:mm:ss').format('YYYY-MM-DD');
        ['판독내용', 'GROSS', 'MICRO', 'DIAGNOSIS', 'NOTE'].forEach((key) => {
            if (sheet[key]) { sheet[key] = sheet[key].replaceAll(/\r\r\n/g, '\r\n'); }
        });
        return sheet;
    });
    return excelData;
}

function isExistImage(date, patientId) {
    const year = date.split('-')[0];
    const month = date.split('-')[1];
    const day = date.split('-')[2];
    const folderPath = path.join('/data_hard/colon', year, month, day, patientId);
    if (!fs.existsSync(folderPath)) { return false; }
    const files = fs.readdirSync(folderPath);
    return files.every(file => file.includes('.jpg'));
}

async function isExistDB(date, patientId) {
    const studyData = await Study.findOne({
        where: {
            study_date: date,
            patient_id: patientId, //`%${excelObj.차트번호}%`
            is_error: false
        }
    });
    const result = {};
    result.isDB = studyData? true: false;
    result.studyData = studyData? studyData : null;
    return result;

}


function saveToExcel(data, fileName) {
    // 데이터를 시트로 변환
    const ws = XLSX.utils.json_to_sheet(data);

    // 워크북 생성
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Users');

    // 엑셀 파일 다운로드
    XLSX.writeFile(wb, `${fileName}.xlsx`);
}

const insert_db = async (excelFileName) => {
    try {
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

        let existImage = [];
        let remainingData = [];

        const excelData = inputExcel(excelFileName);
        // excelData.forEach(async sheet => {
        for (const sheet of excelData) {
            const date = sheet.date;
            const patientId = `${sheet.차트번호.toString().padStart(7, '0')}`;

            const isImage = isExistImage(date, patientId);
            const isDBResult = await isExistDB(date, patientId);
            const studyData = isDBResult.studyData;
            const isDB =isDBResult.isDB;

            if (isImage && isDB) {
                studyData.is_result = true;
                studyData.operators_name = sheet.판독자;
                studyData.interpretation = sheet.판독내용;
                studyData.gross = sheet.GROSS;
                studyData.micro = sheet.MICRO;
                studyData.diagnosis = sheet.DIAGNOSIS;
                studyData.note = sheet.NOTE;
                await studyData.save();
                existImage.push(sheet);
            } else {
                remainingData.push(sheet);
            }
        };

        remainingData = remainingData.map(item => {
            const { date, ...rest } = item; // 'date' 속성을 제외한 나머지 속성들
            return rest; // 'date' 속성이 제거된 새로운 객체 반환
        });

        existImage = existImage.map(item => {
            const { date, ...rest } = item; // 'date' 속성을 제외한 나머지 속성들
            return rest; // 'date' 속성이 제거된 새로운 객체 반환
        });

        saveToExcel(remainingData, '[without_img][merge][rm_EGD]_판독+조직검사_결과');
        saveToExcel(existImage, '[with_img][merge][rm_EGD]_판독+조직검사_결과');
    } catch (error) {
        console.error(error);
    }
}

insert_db('[merge][rm_EGD]_판독+조직검사_결과.xlsx');