const dotenv = require('dotenv');
dotenv.config();

let inputPath = process.env.INPUT_PATH;

const myAddress = {
    aet: process.env.MY_AET,
    ip: process.env.MY_IP,
    port: process.env.MY_DICOM_PORT,
};

const cfindAddress = {
    aet: process.env.CFIND_AET,
    ip: process.env.CFIND_IP,
    port: process.env.CFIND_PORT,
};

const cmoveAddress = {
    aet: process.env.CMOVE_AET,
    ip: process.env.CMOVE_IP,
    port: process.env.CMOVE_PORT,
};


const worklistTag = {
    RequestedProcedureID: process.env.REQUESTED_PROCEDURE_ID,
    RequestedProcedureDescription: process.env.REQUESTED_PROCEDURE_DESCRIPTION,
    ModalitiesInStudy: process.env.MODALITIESINSTUDY
};


const cfindFilter = (data) => {
    let filteringData = data;
    const idFilter = process.env.STUDY_ID_FILTER_LIST ? JSON.parse(process.env.STUDY_ID_FILTER_LIST.replace(/'/g, '"')) : [];
    const descriptionFilter = process.env.STUDY_DESCRIPTION_FILTER_LIST ? JSON.parse(process.env.STUDY_DESCRIPTION_FILTER_LIST.replace(/'/g, '"')) : [];
    const idExcept = process.env.STUDY_ID_EXCEPT_LIST ? JSON.parse(process.env.STUDY_ID_EXCEPT_LIST.replace(/'/g, '"')) : [];
    const descriptionExcept = process.env.STUDY_DESCRIPTION_EXCEPT_LIST ? JSON.parse(process.env.STUDY_DESCRIPTION_EXCEPT_LIST.replace(/'/g, '"')) : [];

    if (idFilter.length > 0) {
        filteringData = filteringData.filter((worklist) =>
            worklist.StudyID &&
            idFilter.some(filter => String(worklist.StudyID).includes(filter))
        );
    }

    if (descriptionFilter.length > 0) {
        filteringData = filteringData.filter((worklist) =>
            worklist.StudyDescription &&
            descriptionFilter.some(filter => String(worklist.StudyDescription).includes(filter))
        );
    }

    if (idExcept.length > 0) {
        filteringData = filteringData.filter((worklist) =>
            worklist.StudyID &&
            idExcept.some(exception => String(worklist.StudyID) !== exception)
        );
    }

    if (descriptionExcept.length > 0) {
        filteringData = filteringData.filter((worklist) =>
            worklist.StudyDescription &&
            descriptionExcept.some(exception => !String(worklist.StudyDescription).includes(exception))
        );
    }

    return filteringData;
}



module.exports = { inputPath, myAddress, cfindAddress, cmoveAddress, worklistTag, cfindFilter };
