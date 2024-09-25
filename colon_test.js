const cfind = require('./dicom/cfind');
const cmove = require('./dicom/cmove');
const { inputPath, myAddress, cfindAddress, cmoveAddress, cfindFilter } = require('./config');

const fs= require('fs');
const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const verbose = process.env.VERBOSE;
const studyDate = process.env.STUDY_DATE;
const endDate = process.env.END_DATE;

const dcmjsDimse = require('dcmjs-dimse');
const  DcmjsDimseScp = require('./dicom/scp');
const { Server } = dcmjsDimse;
const server = new Server(DcmjsDimseScp);



const cfind_test = async (data) => {
    // studyDate

    const duration = endDate ? `${studyDate}_${endDate}`: `${studyDate}`;
    const result = await cfind(myAddress, cfindAddress, data, cfindFilter, verbose);
    const jsonName = inputPath.split('/')[inputPath.split('/').length-1];
    if (fs.existsSync(`./${jsonName}.json`)) {
        fs.unlinkSync(`./${jsonName}.json`);
    }
    fs.writeFileSync(`${duration}_${jsonName}.json`, JSON.stringify(result, null, 2), 'utf8');

    return result;
}

const cmove_test = async (data, studyInstanceUID) => {
    const studyInputPath = path.join(inputPath, studyInstanceUID);
    const cmoveResult = await cmove(myAddress, cmoveAddress, myAddress, data, studyInputPath, verbose);
    return cmoveResult;
}

const countAndMoveFilesInDirectory = (dirPath, targetPath) => {
    let fileCount = 0;

    // 폴더 내의 모든 항목을 읽어옴
    const items = fs.readdirSync(dirPath);

    // targetPath가 존재하지 않으면 생성
    if (!fs.existsSync(targetPath)) {
        fs.mkdirSync(targetPath, { recursive: true });
    }

    for (const item of items) {
        const fullPath = path.join(dirPath, item);
        const targetFullPath = path.join(targetPath, item);
        const stat = fs.statSync(fullPath);

        // 항목이 파일이면 이동 및 카운트 증가
        if (stat.isFile()) {
            fs.renameSync(fullPath, targetFullPath); // 파일 이동
            fileCount++;
        } 
        // 항목이 폴더이면 폴더 내 파일 재귀적으로 처리
        else if (stat.isDirectory()) {
            // targetPath 안에 동일한 이름의 폴더가 없으면 생성
            if (!fs.existsSync(targetFullPath)) {
                fs.mkdirSync(targetFullPath);
            }
            // 폴더 안의 파일도 처리
            fileCount += countAndMoveFilesInDirectory(fullPath, targetFullPath);
            fs.rmdirSync(fullPath); // 폴더가 비어 있으면 삭제
        }
    }

    return fileCount;
};

const colon_test = async () => {
    // cfind
    server.listen(myAddress.port);
    const start = Date.now();
    const data = { QueryRetrieveLevel: 'STUDY', startDate: studyDate, endDate: endDate ? endDate : null, Modality: 'ES'};//StudyInstanceUID: '' ,
    const result = await cfind_test(data);



    
    // server.listen(myAddress.port);
    // const StudyInstanceUID = '1.2.410.200010.82.618.202409100285'
    // const SeriesInstanceUID = '1.3.12.2.1107.5.1.4.64753.30000024091102470124300016570'
    // const data = { QueryRetrieveLevel: 'STUDY', StudyInstanceUID};
    // await cmove_test(data, StudyInstanceUID);
    // cmove
    const studyInstanceUIDList = result.map((study) => {return study.StudyInstanceUID;});
    for (let i = 0; i < studyInstanceUIDList.length; i++) {
        const data = { QueryRetrieveLevel: 'STUDY', StudyInstanceUID: studyInstanceUIDList[i] };
        await cmove_test(data, studyInstanceUIDList[i]);
    }
    const durationPath = endDate ? `${studyDate}_${endDate}`: `${studyDate}`;
    const datePath = path.join('/home/pvmvp/Desktop/colon_test/colon_test/date', durationPath);
    const duration = Date.now() - start;

    const totalSeconds = Math.floor(duration / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;

    console.log(`cfind, cmove all time : ${minutes}분 ${seconds}초(${totalSeconds}s)` );
    console.log('colon study : ', result.length)

    const totalFiles = countAndMoveFilesInDirectory(inputPath, datePath);
    console.log('total dicom File count : ', totalFiles);

    console.log('초당 다운 수 (이미지수/s) : ', totalFiles/totalSeconds)
    console.log('이미지 1장당 걸린 시간(s/이미지수) : ', totalSeconds/totalFiles)
    console.log('내시경 한건당 이미지 수 : ', totalFiles/result.length)



}

colon_test();