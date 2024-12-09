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

function inputExcel(excelFile, startDate, endDate) {
    // Excel 파일 경로 지정
    const filePath = path.join(__dirname, excelFile); //'result2.xlsx'
    const excel = XLSX.readFile(filePath);
    const sheetName = excel.SheetNames[0]; // 첫 번째 시트 선택
    const worksheet = excel.Sheets[sheetName];
    let excelData = XLSX.utils.sheet_to_json(worksheet);

    // 데이터 처리
    excelData = excelData.map((sheet) => {
        sheet.date = dayjs(sheet['날짜'], 'MM/DD/YYYY HH:mm:ss').format('YYYY-MM-DD');
        ['판독내용', 'GROSS', 'MICRO', 'DIAGNOSIS', 'NOTE'].forEach((key) => {
            if (sheet[key]) {
                sheet[key] = sheet[key].replaceAll(/\r\r\n/g, '\r\n');
            }
        });
        return sheet;
    });

    // 필터링: 시작 날짜와 종료 날짜 사이의 데이터만 포함
    excelData = excelData.filter(item => {
        const recordDate = dayjs(item.date); // 'date' 필드를 dayjs 객체로 변환
        const start = dayjs(startDate, 'YYYY-MM'); // 시작 날짜
        const end = dayjs(endDate, 'YYYY-MM'); // 종료 날짜

        return recordDate.isBetween(end, start, null, '[]'); // 역순 범위도 포함
    });

    return excelData;
}

function isExistImage(imagePath, date, patientId) {
    let stringPatientId = patientId;
    const year = date.split('-')[0];
    const month = date.split('-')[1];
    const day = date.split('-')[2];
    if(typeof stringPatientId !== 'string'){
        stringPatientId = `${stringPatientId.toString().padStart(7, '0')}`;
    }
    const folderPath = path.join(imagePath, year, month, day, stringPatientId);
    if (!fs.existsSync(folderPath)) { 
        return false; 
    }
    if(fs.readdirSync(folderPath).length ===0 ){
        return false;
    }
    const files = fs.readdirSync(folderPath);
    return files.every(file => file.includes('.jpg'));
}

async function isExistDB(date, patientId) {
    let stringPatientId = patientId;
    if(typeof stringPatientId !== 'string'){
        stringPatientId = `${stringPatientId.toString().padStart(7, '0')}`;
    }
    const studyData = await Study.findOne({
        where: {
            study_date: date,
            patient_id: stringPatientId, //`%${excelObj.차트번호}%`
            is_error: false,
            is_cmove: true,
            is_convert: true
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


const excelSplit = async (imagePath, excelFileName, startYear, endYear) => {
    try {
        // mysql db connection
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

        let existImage = [];
        let remainingData = [];

        const excelData = inputExcel(excelFileName, startYear, endYear);
        
        for (const sheet of excelData) {
            const date = sheet.date;
            const isImage = isExistImage(imagePath, date, sheet.차트번호);
            const isDBResult = await isExistDB(date, sheet.차트번호);

            // const studyData = isDBResult.studyData;
            const isDB =isDBResult.isDB;

            if (isImage && isDB) {
                // studyData.is_result = true;
                // studyData.operators_name = sheet.판독자;
                // studyData.interpretation = sheet.판독내용;
                // studyData.gross = sheet.GROSS;
                // studyData.micro = sheet.MICRO;
                // studyData.diagnosis = sheet.DIAGNOSIS;
                // studyData.note = sheet.NOTE;
                // await studyData.save();
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

        saveToExcel(remainingData, `[${endYear}-${startYear}][without_img][merge][rm_EGD]_판독+조직검사_결과`);
        saveToExcel(existImage, `[${endYear}-${startYear}][with_img][merge][rm_EGD]_판독+조직검사_결과`);
    } catch (error) {
        console.error(error);
    }
}

const imagePath = '/data_hard/colon_crop';
const excelFileName = '[merge][rm_EGD]_판독+조직검사_결과.xlsx';
const startDate = '2024-09';
const endDate = '2024-01';

excelSplit(imagePath, excelFileName, startDate, endDate);
