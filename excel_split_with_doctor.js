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

function inputExcel(excelFile, doctorName) {
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
    excelData = excelData.filter(item => item['판독자'] === doctorName);
    return excelData;
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


const excelSplit = async (excelFileName, doctorName) => {
    try {
        let excelData = inputExcel(excelFileName, doctorName);
        
        excelData = excelData.map(item => {
            const { date, ...rest } = item; // 'date' 속성을 제외한 나머지 속성들
            return rest; // 'date' 속성이 제거된 새로운 객체 반환
        });

        saveToExcel(excelData, `[${doctorName}]${excelFileName.split('.xlsx')[0]}`);
    } catch (error) {
        console.error(error);
    }
}


const excelFileName = '[2024-2020][with_img][merge][rm_EGD]_판독+조직검사_결과.xlsx';
const doctorName = '이동현';

excelSplit(excelFileName, doctorName);
