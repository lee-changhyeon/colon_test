const dimse = require('dicom-dimse-native');
const dicomTag = require('./dicom_tag');
const iconv = require('iconv-lite');
const dotenv = require('dotenv');
dotenv.config();

const encodingType = process.env.SPECIFIC_CHARACTER_SET;

const cfindProtocol = (source, target, tags, verbose) => {
    return new Promise((resolve, reject) => {
        dimse.findScu(
            {
                source,
                target,
                tags,
                verbose,
            },
            (result) => {
                try {
                    const cfindResult = JSON.parse(result);
                    if (cfindResult.status === 'success') {
                        resolve(JSON.parse(cfindResult.container));
                    } else if (cfindResult.status === 'failure') {
                        console.error(`cfind error : ${cfindResult.message}`);
                        resolve(`Failed : ${cfindResult.message}`);
                    }
                } catch (error) {
                    console.error(`cfind error : ${error.message}`);
                    resolve(`Failed : ${error.message}`);
                }
            },
        );
    });
};

const dataToTag = (data) => {
    const newTag = JSON.parse(JSON.stringify(dicomTag.tag));

    if (data.startDate) {
        if (data.patientId) { newTag.PatientID.value = data.patientId; }
        if (data.startDate) { newTag.StudyDate.value = data.startDate }
        if (data.startDate && data.endDate) { newTag.StudyDate.value = newTag.StudyDate.value + '-' + data.endDate; }
    }

    if (data.Modality) {
        newTag.Modality.value = data.Modality;
    }

    if (data.ModalitiesInStudy) {
        newTag.ModalitiesInStudy.value = data.ModalitiesInStudy;
    }

    if (data.QueryRetrieveLevel === 'PATIENT') {
        newTag.QueryRetrieveLevel.value = 'PATIENT';

        const cfindPatientTag = [
            newTag.QueryRetrieveLevel,
            newTag.PatientName,
            newTag.PatientID,
            newTag.PatientBirthDate,
            newTag.PatientSex,
        ];
        return cfindPatientTag;
    } else if (data.QueryRetrieveLevel === 'STUDY') {
        newTag.QueryRetrieveLevel.value = 'STUDY';
        // newTag.ModalitiesInStudy.value = 'ES';
        // newTag.Modality.value = 'ES';

        if (data.StudyInstanceUID) {
            newTag.StudyInstanceUID.value = data.StudyInstanceUID;
        }

        // study level에서 필요한 tag만 살림
        const cfindStudyTag = [
            newTag.SpecificCharacterSet,
            newTag.StudyDate,
            newTag.StudyTime,
            newTag.AccessionNumber,
            newTag.QueryRetrieveLevel,
            newTag.Modality,
            newTag.ModalitiesInStudy,
            newTag.StudyDescription,
            newTag.PatientName,
            newTag.PatientID,
            newTag.PatientBirthDate,
            newTag.PatientSex,
            newTag.StudyInstanceUID,
            newTag.StudyID,

            // newTag.AcquisitionDate,
            // newTag.ContentDate,
            // newTag.AcquisitionTime,
            // newTag.ContentTime,
            // newTag.QueryRetrieveView,
            // newTag.InstitutionName,
            // newTag.SOPClassesinStudy,
            // newTag.ReferringPhysicianName,
            // newTag.OperatorsName,
            // newTag.PhysiciansofRecord,
            // newTag.NameofPhysiciansReadingStudy,
            // newTag.AdmittingDiagnosesDescription,
            // newTag.patientAge,
            // newTag.patientSize,
            // newTag.patientWeight,
            // newTag.Occupation,
            // newTag.AdditionalPatientHistory,
            // newTag.PatientComments,
            // newTag.OtherStudyNumbers,
            // newTag.NumberofStudyRelatedSeries,
            // newTag.NumberofStudyRelatedInstances,
        ];

        return cfindStudyTag;
    } else if (data.QueryRetrieveLevel === 'SERIES') {
        newTag.QueryRetrieveLevel.value = 'SERIES';

        if (data.StudyInstanceUID) {
            newTag.StudyInstanceUID.value = data.StudyInstanceUID;
        }

        // study level에서 필요한 tag만 살림
        const cfindSeriesTag = [
            newTag.SpecificCharacterSet,
            newTag.StudyDate,
            newTag.StudyTime,
            newTag.AccessionNumber,
            newTag.QueryRetrieveLevel,
            newTag.Modality,
            newTag.ModalitiesInStudy,
            newTag.StudyDescription,
            newTag.PatientName,
            newTag.PatientID,
            newTag.PatientBirthDate,
            newTag.PatientSex,
            newTag.StudyInstanceUID,
            newTag.SeriesInstanceUID,
            newTag.StudyID,

            // newTag.AcquisitionDate,
            // newTag.ContentDate,
            // newTag.AcquisitionTime,
            // newTag.ContentTime,
            // newTag.QueryRetrieveView,
            // newTag.InstitutionName,
            // newTag.SOPClassesinStudy,
            // newTag.ReferringPhysicianName,
            // newTag.OperatorsName,
            // newTag.PhysiciansofRecord,
            // newTag.NameofPhysiciansReadingStudy,
            // newTag.AdmittingDiagnosesDescription,
            // newTag.patientAge,
            // newTag.patientSize,
            // newTag.patientWeight,
            // newTag.Occupation,
            // newTag.AdditionalPatientHistory,
            // newTag.PatientComments,
            // newTag.OtherStudyNumbers,
            // newTag.NumberofStudyRelatedSeries,
            // newTag.NumberofStudyRelatedInstances,
        ];
        return cfindSeriesTag;
    }
};

const tagToData = (tagList) => {
    const data = tagList.map((tag) => {
        const decodedTag = { status: 1 };
        if (tag[dicomTag.key.SpecificCharacterSet] && tag[dicomTag.key.SpecificCharacterSet].Value.length !== 0) {
            decodedTag.SpecificCharacterSet = tag[dicomTag.key.SpecificCharacterSet].Value[0];
        }
        if (tag[dicomTag.key.StudyDate]) {
            decodedTag.StudyDate = tag[dicomTag.key.StudyDate].Value[0];
        }
        // if (tag[dicomTag.key.AcquisitionDate]) {
        //   decodedTag.AcquisitionDate = tag[dicomTag.key.AcquisitionDate].Value[0];
        // }
        // if (tag[dicomTag.key.ContentDate]) {
        //   decodedTag.ContentDate = tag[dicomTag.key.ContentDate].Value[0];
        // }
        if (tag[dicomTag.key.StudyTime]) {
            decodedTag.StudyTime = tag[dicomTag.key.StudyTime].Value[0];
        }
        // if (tag[dicomTag.key.AcquisitionTime]) {
        //   decodedTag.AcquisitionTime = tag[dicomTag.key.AcquisitionTime].Value[0];
        // }
        // if (tag[dicomTag.key.ContentTime]) {
        //   decodedTag.ContentTime = tag[dicomTag.key.ContentTime].Value[0];
        // }
        if (tag[dicomTag.key.AccessionNumber]) {
            decodedTag.AccessionNumber = tag[dicomTag.key.AccessionNumber].Value[0];
        }
        if (tag[dicomTag.key.QueryRetrieveLevel]) {
            decodedTag.QueryRetrieveLevel = tag[dicomTag.key.QueryRetrieveLevel].Value[0];
        }
        if (tag[dicomTag.key.Modality]) {
            decodedTag.Modality = tag[dicomTag.key.Modality].Value[0];
        }
        if (tag[dicomTag.key.ModalitiesInStudy]) {
            decodedTag.ModalitiesInStudy = tag[dicomTag.key.ModalitiesInStudy].Value.join(',');
        }
        if (tag[dicomTag.key.PatientID]) {
            decodedTag.PatientID = tag[dicomTag.key.PatientID].Value[0];
        }
        if (tag[dicomTag.key.PatientBirthDate]) {
            decodedTag.PatientBirthDate = tag[dicomTag.key.PatientBirthDate].Value[0];
        } if (tag[dicomTag.key.PatientSex]) {
            decodedTag.PatientSex = tag[dicomTag.key.PatientSex].Value[0];
        }
        // if (tag[dicomTag.key.Occupation]) {
        //   decodedTag.Occupation = tag[dicomTag.key.Occupation].Value[0];
        // }
        if (tag[dicomTag.key.StudyInstanceUID]) {
            decodedTag.StudyInstanceUID = tag[dicomTag.key.StudyInstanceUID].Value[0];
        }
        if (tag[dicomTag.key.SeriesInstanceUID]) {
            decodedTag.SeriesInstanceUID = tag[dicomTag.key.SeriesInstanceUID].Value[0];
        }
        if (tag[dicomTag.key.StudyID]) {
            decodedTag.StudyID = tag[dicomTag.key.StudyID].Value[0];
        }
        // if (tag[dicomTag.key.OtherStudyNumbers]) {
        //   decodedTag.OtherStudyNumbers = tag[dicomTag.key.OtherStudyNumbers].Value[0];
        // }
        if (encodingType === 'utf-8') {//if (!decodedTag.SpecificCharacterSet || decodedTag.SpecificCharacterSet === 'ISO_IR 192') {
            if (tag[dicomTag.key.StudyDescription]) {
                decodedTag.StudyDescription = tag[dicomTag.key.StudyDescription].Value[0];
            }
            if (tag[dicomTag.key.PatientName]) {
                decodedTag.PatientName = tag[dicomTag.key.PatientName].Value[0]['Alphabetic'];
            }
            // if (tag[dicomTag.key.InstitutionName]) {
            //   decodedTag.InstitutionName = tag[dicomTag.key.InstitutionName].Value[0];
            // }
            // if (tag[dicomTag.key.OperatorsName]) {
            //   decodedTag.OperatorsName = tag[dicomTag.key.OperatorsName].Value[0]['Alphabetic'];
            // }
        } else if (encodingType === 'euc-kr') {//} else if (decodedTag.SpecificCharacterSet === 'ISO 2022 IR 149') {
            if (tag[dicomTag.key.StudyDescription] && tag[dicomTag.key.StudyDescription].Value.length !== 0) {
                const encode = Array.from(tag[dicomTag.key.StudyDescription].Value[0], (char) => char.charCodeAt(0));
                decodedTag.StudyDescription = iconv.decode(encode, 'euc-kr');
            }
            if (tag[dicomTag.key.PatientName]) {
                const encode = Array.from(tag[dicomTag.key.PatientName].Value[0]['Alphabetic'], (char) => char.charCodeAt(0));
                decodedTag.PatientName = iconv.decode(encode, 'euc-kr');
            }
            //   if (tag[dicomTag.key.InstitutionName]) {
            //     const encode = Array.from(tag[dicomTag.key.InstitutionName].Value[0], (char) => char.charCodeAt(0));
            //     decodedTag.InstitutionName = iconv.decode(encode, 'euc-kr');
            //   }
            //   if (tag[dicomTag.key.OperatorsName]) {
            //     const encode = Array.from(tag[dicomTag.key.OperatorsName].Value[0]['Alphabetic'], (char) => char.charCodeAt(0));
            //     decodedTag.OperatorsName = iconv.decode(encode, 'euc-kr');
            //   }
        }
        return decodedTag;
    });

    return data;
};

const cfind = async (source, target, data, filter, verbose) => {
    const tag = dataToTag(data);
    const cfindResult = await cfindProtocol(source, target, tag, verbose);
    if (Array.isArray(cfindResult) && cfindResult.length > 0) {
        return filter(tagToData(cfindResult));
    } else {
        return cfindResult;
    }
};

module.exports = cfind;
