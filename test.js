const fs = require('fs');
const path = require('path');
const dcmjs = require('dcmjs');
const sharp = require('sharp');
const jpeg = require('jpeg-js');

const inputPath = '/workspace/colon_test/sample'
const outputPath = '/workspace/colon_test/sample_result_jpeg';

const test = (patientId, studyDate, imageExtension) => {
    const dcmFileList = fs.readdirSync(inputPath);

    const dcmList = dcmFileList.map((dcmName) => {
        const dcmBuffer = fs.readFileSync(path.join(inputPath, dcmName)).buffer;
        const dcmDataSet = dcmjs.data.DicomMessage.readFile(dcmBuffer);
        const transferSyntax = dcmDataSet.meta['00020010'].Value[0];
        const contentTime = Number(dcmDataSet.dict['00080033'].Value[0]);
        const raws = dcmDataSet.dict["00280010"].Value[0];
        const columns = dcmDataSet.dict["00280011"].Value[0];
        const samplesPerPixel = dcmDataSet.dict["00280002"].Value[0];
        let pixelData = dcmDataSet.dict["7FE00010"].Value[0];

        if (transferSyntax === '1.2.840.10008.1.2.4.50') { // JPEG Baseline (Process 1)
            const jpegImageData = Buffer.from(pixelData);
            const decodedImage = jpeg.decode(jpegImageData, true);
            pixelData = Buffer.from(decodedImage.data); // JPEG 해제된 데이터
        } else if (transferSyntax === '1.2.840.10008.1.2.4.70') { // JPEG Lossless, Nonhierarchical, First - Order Prediction (Processes 14[Selection Value 1])
            // const jpegImageData = Buffer.from(pixelData);
            // const decodedImage = jpeg.decode(jpegImageData, true);
            // pixelData = Buffer.from(decodedImage.data); // JPEG 해제된 데이터
        }
        console.log(pixelData)
        console.log(raws * columns * samplesPerPixel)

        return { contentTime, raws, columns, samplesPerPixel, pixelData }
    });

    dcmList.sort((a, b) => a.contentTime - b.contentTime);


    if (imageExtension === 'png') {
        dcmList.forEach(({ raws, columns, samplesPerPixel, pixelData }, index) => {
            const pngFileName = `${outputPath}/${patientId}_${studyDate}_${String(index + 1).padStart(4, '0')}.png`; // 파일 이름 생성

            sharp(Buffer.from(pixelData), {
                raw: {
                    width: columns,
                    height: raws,
                    channels: samplesPerPixel + 1,
                }
            }).toFile(pngFileName, (err, info) => {
                if (err) {
                    console.error('Error saving PNG', err);
                }
            });
        });
    } else if (imageExtension === 'jpg') {
        dcmList.forEach(({ raws, columns, samplesPerPixel, pixelData }, index) => {
            const jpegFileName = `${outputPath}/${patientId}_${studyDate}_${String(index + 1).padStart(4, '0')}.jpg`; // 파일 이름 생성

            sharp(pixelData, {
                raw: {
                    width: columns,
                    height: raws,
                    channels: samplesPerPixel + 1 // 그레이스케일 또는 RGB
                }
            }).jpeg({ quality: 100 }).toFile(jpegFileName, (err, info) => {
                if (err) {
                    console.error('Error saving JPEG', err);
                }
            });
        });
    }

};

test(123, 240930, 'jpg');