const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');
const dayjs = require('dayjs');

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

// 폴더 복사 함수
function copyFolderSync(src, dest) {
    // 대상 폴더가 존재하지 않으면 생성
    if (!fs.existsSync(dest)) {
      fs.mkdirSync(dest, { recursive: true });
    }
  
    // src 디렉토리 읽기
    const items = fs.readdirSync(src);
  
    // 모든 파일과 폴더를 복사
    for (const item of items) {
      const srcPath = path.join(src, item); // 원본 경로
      const destPath = path.join(dest, item); // 대상 경로
  
      if (fs.lstatSync(srcPath).isDirectory()) {
        // 폴더이면 재귀적으로 복사
        copyFolderSync(srcPath, destPath);
      } else {
        // 파일이면 복사
        fs.copyFileSync(srcPath, destPath);
      }
    }
  }

function copyImage (excelFileName, copyFolderPath, srcFolderPath) {
    const excelData = inputExcel(excelFileName);

    excelData.forEach((excel)=>{
        let stringPatientId = excel['차트번호'];
        const year = excel.date.split('-')[0];
        const month = excel.date.split('-')[1];
        const day = excel.date.split('-')[2];
        if(typeof stringPatientId !== 'string'){
            stringPatientId = `${stringPatientId.toString().padStart(7, '0')}`;
        }
        const srcPath = path.join(srcFolderPath, year, month, day, stringPatientId);
        const copyPath = path.join(copyFolderPath, year, month, day, stringPatientId);
        if(fs.readdirSync(srcPath).length === 0){
            console.log(year, month, day, stringPatientId);
            return;
        }
        copyFolderSync(srcPath, copyPath);
    });

}


const excelFileName = '[2024-2020][with_img][merge][rm_EGD]_판독+조직검사_결과.xlsx';
const copyFolderPath = '/data_hard/colon_crop_with_result';
const srcFolderPath = '/data_hard/colon_crop';

copyImage(excelFileName, copyFolderPath, srcFolderPath);