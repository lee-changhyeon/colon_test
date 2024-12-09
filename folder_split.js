const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');
const dayjs = require('dayjs');

const splitExcelName = '[with_img][merge][rm_EGD]_판독+조직검사_결과.xlsx';
const originalFolder = '/data_hard/colon_crop';
const newFolder = '/data_hard/colon_crop_with_interpretation';

function inputExcel(excelFile) {
    // Excel 파일 경로 지정
    const filePath = path.join(__dirname, excelFile); //'result2.xlsx'
    const excel = XLSX.readFile(filePath);
    const sheetName = excel.SheetNames[0]; // 첫 번째 시트 선택
    const worksheet = excel.Sheets[sheetName];
    let excelData = XLSX.utils.sheet_to_json(worksheet);
    excelData = excelData.map((sheet) => {
        sheet.date = dayjs(sheet['날짜'], 'DD/MM/YYYY HH:mm:ss').format('YYYY-MM-DD');
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

function splitFolder(excelFile, originalFolder, newFolder) {
    const excelData = inputExcel(excelFile);

    for (const sheet of excelData) {
        const date = sheet.date;
        const patientId = `${sheet.차트번호.toString().padStart(7, '0')}`;
        const isImage = isExistImage(date, patientId);

        const year = date.split('-')[0];
        const month = date.split('-')[1];
        const day = date.split('-')[2];

        if (isImage) {
            const sourceFolder = path.join(originalFolder, year, month, day, patientId);
            const destinationFolder = path.join(newFolder, year, month, day, patientId);

            // 폴더가 없으면 생성
            if (!fs.existsSync(destinationFolder)) {
                fs.mkdirSync(destinationFolder, { recursive: true });
            }
            // 파일 이동 (동기 방식)
            try {
                const files = fs.readdirSync(sourceFolder);
                files.forEach(file => {
                    if (file.includes('.jpg')) {  // 이미지 파일만 이동
                        const sourceFile = path.join(sourceFolder, file);
                        const destinationFile = path.join(destinationFolder, file);
                        fs.copyFileSync(sourceFile, destinationFile);
                        console.log(`File moved from ${sourceFile} to ${destinationFile}`);
                    }
                });
            } catch (err) {
                console.error('Error moving file:', err);
            }
        }
    }
}


splitFolder(splitExcelName, originalFolder, newFolder);