const fs = require('fs');
const dimse = require('dicom-dimse-native');
const dicomTag = require('./dicom_tag');

const cmoveProtocol = (source, target, destination, tags, inputPath, verbose) => {
    return new Promise((resolve, reject) => {
        dimse.moveScu(
            {
                source,
                target,
                tags,
                destination,
                verbose,
            },
            (result) => {
                try {
                    const cmoveResult = JSON.parse(result);
                    if (cmoveResult.status === 'success') {
                        if (fs.readdirSync(inputPath).length === 0) {
                            console.error('cmove error : Study input path does not exist.');
                            resolve('Failed : Study input path does not exist.');
                        } else {
                            resolve('Success : The DICOM C-move message was executed.');
                        }

                    } else if (cmoveResult.status === 'failure') {
                        console.error(`cmove error : ${cmoveResult.message}`);
                        resolve(`Failed : ${cmoveResult.message}`);
                    }
                } catch (error) {
                    console.error(`cmove error : ${error.message}`);
                    resolve(`Failed : ${error.message}`);
                }
            },
        );
    });
};

const dataToTag = (data) => {
    const newTag = JSON.parse(JSON.stringify(dicomTag.tag));

    if (data.QueryRetrieveLevel === 'STUDY') {
        newTag.QueryRetrieveLevel.value = 'STUDY';
        newTag.StudyInstanceUID.value = data.StudyInstanceUID
        const cmoveStudyTag = [
            newTag.QueryRetrieveLevel,
            newTag.StudyInstanceUID
        ];
        return cmoveStudyTag;

    } else if (data.QueryRetrieveLevel === 'SERIES') {
        newTag.QueryRetrieveLevel.value = 'SERIES';
        newTag.SeriesInstanceUID.value = `${data.StudyInstanceUID}.1`;
        const cmoveSeriesTag = [
            newTag.QueryRetrieveLevel,
            newTag.SeriesInstanceUID
        ];
        return cmoveSeriesTag;
    }
}


const cmove = async (source, target, destination, data, inputPath, verbose) => {
    const tag = dataToTag(data);
    const cmoveResult = await cmoveProtocol(source, target, destination, tag, inputPath, verbose);
    return cmoveResult;
}

module.exports = cmove;