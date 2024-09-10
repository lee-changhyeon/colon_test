const cfind = require('./dicom/cfind');
const cmove = require('./dicom/cmove');
const { inputPath, myAddress, cfindAddress, cmoveAddress, cfindFilter } = require('./config');


const path = require('path');
const dotenv = require('dotenv');
dotenv.config();
const verbose = process.env.VERBOSE;
const studyDate = process.env.STUDY_DATE;



const cfind_test = async () => {
    const cfindRequestTag = { QueryRetrieveLevel: 'STUDY', startDate: studyDate };
    const result = await cfind(myAddress, cfindAddress, cfindRequestTag, cfindFilter, verbose);
    return result;
}

const cmove_test = async (data, studyInstanceUID) => {
    const studyInputPath = path.join(inputPath, studyInstanceUID);
    const cmoveResult = await cmove(myAddress, cmoveAddress, myAddress, data, studyInputPath, verbose);
    return cmoveResult;
}

const colon_test = async () => {
    const result = await cfind_test();
    console.log(result);
    console.log(result.length);
    const studyInstanceUIDList = result.map((study) => {
        return study.StudyInstanceUID;
    });

    for (let i = 0; i < studyInstanceUIDList.length; i++) {
        const data = { QueryRetrieveLevel: 'STUDY', StudyInstanceUID: studyInstanceUIDList[i] };
        await cmove_test(data, studyInstanceUIDList[i]);
    }
}

colon_test();