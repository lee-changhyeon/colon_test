const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs').promises;
const dayjs = require('dayjs');

// Excel 데이터 읽기 함수
async function inputExcel(excelFile) {
    const filePath = path.join(__dirname, excelFile);
    const excel = XLSX.readFile(filePath);
    const sheetName = excel.SheetNames[0];
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
async function copyFolderAsync(src, dest) {
    try {
        const items = await fs.readdir(src, { withFileTypes: true });
        await fs.mkdir(dest, { recursive: true });

        for (const item of items) {
            const srcPath = path.join(src, item.name);
            const destPath = path.join(dest, item.name);

            if (item.isDirectory()) {
                await copyFolderAsync(srcPath, destPath);
            } else {
                await fs.copyFile(srcPath, destPath);
            }
        }
    } catch (error) {
        console.error(`Failed to copy folder: ${src} -> ${dest}`, error.message);
    }
}

// 지연 함수
async function delay(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

// 배치로 파일 복사 처리
async function copyImageBatch(excelFileName, copyFolderPath, srcFolderPath, batchSize = 10, delayMs = 2000) {
    const excelData = await inputExcel(excelFileName);

    // 배치 처리
    for (let i = 0; i < excelData.length; i += batchSize) {
        const batch = excelData.slice(i, i + batchSize);

        // 현재 배치의 작업 실행
        await Promise.all(
            batch.map(async (excel) => {
                let stringPatientId = excel['차트번호'];
                const [year, month, day] = excel.date.split('-');

                if (typeof stringPatientId !== 'string') {
                    stringPatientId = `${stringPatientId.toString().padStart(7, '0')}`;
                }

                const srcPath = path.join(srcFolderPath, year, month, day, stringPatientId);
                const copyPath = path.join(copyFolderPath, year, month, day, stringPatientId);

                try {
                    const files = await fs.readdir(srcPath);
                    if (files.length === 0) {
                        console.log(`Empty folder: ${srcPath}`);
                        return;
                    }

                    console.log(`Copying: ${srcPath} -> ${copyPath}`);
                    await copyFolderAsync(srcPath, copyPath);
                } catch (error) {
                    console.error(`Error accessing or copying folder: ${srcPath}`, error.message);
                }
            })
        );

        // 배치 완료 후 지연
        console.log(`Batch ${Math.floor(i / batchSize) + 1} completed. Waiting...`);
        await delay(delayMs);
    }
}

// 실행
const excelFileName = '[2024][with_img][merge][rm_EGD]_판독+조직검사_결과.xlsx';
const copyFolderPath = '/data_hard/colon_crop_with_result';
const srcFolderPath = '/data_hard/colon_crop';

copyImageBatch(excelFileName, copyFolderPath, srcFolderPath, 10, 2000)
    .then(() => console.log('Copy operation completed'))
    .catch((error) => console.error('Copy operation failed', error.message));