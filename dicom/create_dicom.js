const dcmjs = require('dcmjs');
const fs = require('fs');
const path = require('path');
const dcmPath = path.join(__dirname, 'sample_image.dcm');

const createDicom = (tag, savePath, imageName) => {
    const dcmBuffer = fs.readFileSync(dcmPath).buffer;
    const originDataSet = dcmjs.data.DicomMessage.readFile(dcmBuffer);
    const dicomData = new dcmjs.data.DicomDict(originDataSet.meta);
    dicomData.dict = originDataSet.dict;

    // (0002,0002) UI MediaStorageSOPClassUID
    if (tag.MediaStorageSOPClassUID) {
        dicomData.meta["00020002"] = { vr: "UI", Value: [tag.mediaStorageSOPClassUID] };
    }
    // (0002,0003) UI MediaStorageSOPInstanceUID
    if (tag.MediaStorageSOPInstanceUID) {
        dicomData.meta["00020003"] = { vr: "UI", Value: [tag.MediaStorageSOPInstanceUID] };
    }
    // (0002,0010) UI TransferSyntaxUID
    if (tag.TransferSyntaxUID) {
        dicomData.meta["00020010"] = { vr: "UI", Value: [tag.TransferSyntaxUID] };
    }
    // (0002,0012) UI ImplementationClassUID
    if (tag.ImplementationClassUID) {
        dicomData.meta["00020012"] = { vr: "UI", Value: [tag.ImplementationClassUID] };
    }
    // (0002,0013) SH ImplementationVersionName
    if (tag.ImplementationVersionName) {
        dicomData.meta["00020013"] = { vr: "SH", Value: [tag.ImplementationVersionName] };
    }
    // (0002,0016) AE SourceApplicationEntityTitle
    if (tag.SourceApplicationEntityTitle) {
        dicomData.meta["00020016"] = { vr: "AE", Value: [tag.SourceApplicationEntityTitle] };
    }
    // (0008,0005) CS SpecificCharacterSet
    if (tag.SpecificCharacterSet) {
        dicomData.dict["00080005"] = { vr: "CS", Value: [tag.SpecificCharacterSet] };
    }
    // (0008,0016) UI SOPClassUID
    if (tag.SOPClassUID) {
        dicomData.dict["00080016"] = { vr: "UI", Value: [tag.SOPClassUID] };
    }
    // (0008,0018) UI SOPInstanceUID
    if (tag.SOPInstanceUID) {
        dicomData.dict["00080018"] = { vr: "UI", Value: [tag.SOPInstanceUID] };
    }
    // (0008,0020) DA StudyDate
    if (tag.StudyDate) {
        dicomData.dict["00080020"] = { vr: "DA", Value: [tag.StudyDate] };
    }
    // (0008,0021) DA AcquisitionDate
    if (tag.AcquisitionDate) {
        dicomData.dict["00080022"] = { vr: "DA", Value: [tag.AcquisitionDate] };
    }
    // (0008,0023) DA ContentDate
    if (tag.ContentDate) {
        dicomData.dict["00080023"] = { vr: "DA", Value: [tag.ContentDate] };
    }
    // (0008,0030) TM StudyTime
    if (tag.StudyTime) {
        dicomData.dict["00080030"] = { vr: "TM", Value: [tag.StudyTime] };
    }
    // (0008,0031) TM AcquisitionTime
    if (tag.AcquisitionTime) {
        dicomData.dict["00080032"] = { vr: "TM", Value: [tag.AcquisitionTime] };
    }
    // (0008,0033) TM ContentTime
    if (tag.ContentTime) {
        dicomData.dict["00080033"] = { vr: "TM", Value: [tag.ContentTime] };
    }
    // (0008,0050) SH AccessionNumber
    if (tag.AccessionNumber) {
        dicomData.dict["00080050"] = { vr: "SH", Value: [tag.AccessionNumber] };
    }
    // (0008,0060) CS Modality
    if (tag.Modality) {
        dicomData.dict["00080060"] = { vr: "CS", Value: [tag.Modality] };
    }
    // (0008,0061) CS ModalitiesInStudy
    if (tag.ModalitiesInStudy) {
        dicomData.dict["00080061"] = { vr: "CS", Value: [tag.ModalitiesInStudy] };
    }
    // (0008,0064) CS ConversionType
    if (tag.ConversionType) {
        dicomData.dict["00080064"] = { vr: "CS", Value: [tag.ConversionType] };
    }
    // (0008,0080) LO InstitutionName
    if (tag.InstitutionName) {
        dicomData.dict["00080080"] = { vr: "LO", Value: [tag.InstitutionName] };
    }
    // (0008,1030) LO StudyDescription
    if (tag.StudyDescription) {
        dicomData.dict["00081030"] = { vr: "LO", Value: [tag.StudyDescription] };
    }
    // (0008,103E) LO SeriesDescription
    if (tag.SeriesDescription) {
        dicomData.dict["0008103E"] = { vr: "LO", Value: [tag.SeriesDescription] };
    }
    // (0008,1070) PN OperatorsName
    if (tag.OperatorsName) {
        dicomData.dict["00081070"] = { vr: "PN", Value: [tag.OperatorsName] };
    }
    // (0008,2111) ST DerivationDescription
    if (tag.DerivationDescription) {
        dicomData.dict["00082111"] = { vr: "ST", Value: [tag.DerivationDescription] };
    }
    // (0010,0010) PN PatientName
    if (tag.PatientName) {
        dicomData.dict["00100010"] = { vr: "PN", Value: [tag.PatientName] };
    }
    // (0010,0020) LO PatientID
    if (tag.PatientID) {
        dicomData.dict["00100020"] = { vr: "PN", Value: [tag.PatientID] };
    }
    // (0010,0030) DA PatientBirthDate
    if (tag.PatientBirthDate) {
        dicomData.dict["00100030"] = { vr: "DA", Value: [tag.PatientBirthDate] };
    }
    // (0010,0040) CS PatientSex
    if (tag.PatientSex) {
        dicomData.dict["00100040"] = { vr: "CS", Value: [tag.PatientSex] };
    }
    // (0020,000D) UI StudyInstanceUID
    if (tag.StudyInstanceUID) {
        dicomData.dict["0020000D"] = { vr: "UI", Value: [tag.StudyInstanceUID] };
    }
    // (0020,000E) UI SeriesInstanceUID
    if (tag.SeriesInstanceUID) {
        dicomData.dict["0020000E"] = { vr: "UI", Value: [tag.SeriesInstanceUID] };
    }
    // (0020,0010) SH StudyID
    if (tag.StudyID) {
        dicomData.dict["00200010"] = { vr: "SH", Value: [tag.StudyID] };
    }
    // (0020,0011) IS SeriesNumber
    if (tag.SeriesNumber) {
        dicomData.dict["00200011"] = { vr: "IS", Value: [tag.SeriesNumber] };
    }
    // (0020,0013) IS InstanceNumber
    if (tag.InstanceNumber) {
        dicomData.dict["00200013"] = { vr: "IS", Value: [tag.InstanceNumber] };
    }
    // (0028,0002) US SamplesPerPixel
    if (tag.SamplesPerPixel) {
        dicomData.dict["00280002"] = { vr: "US", Value: [tag.SamplesPerPixel] };
    }
    // (0028,0004) CS PhotometricInterpretation
    if (tag.PhotometricInterpretation) {
        dicomData.dict["00280004"] = { vr: "CS", Value: [tag.PhotometricInterpretation] };
    }
    // (0028,0006) US PlanarConfiguration
    if (tag.PlanarConfiguration) {
        dicomData.dict["00280006"] = { vr: "US", Value: [tag.PlanarConfiguration] };
    }
    // (0028,0008) IS NumberOfFrames
    if (tag.NumberOfFrames) {
        dicomData.dict["00280008"] = { vr: "IS", Value: [tag.NumberOfFrames] };
    }
    // (0028,0010) US Rows
    if (tag.Rows) {
        dicomData.dict["00280010"] = { vr: "US", Value: [tag.Rows] };
    }
    // (0028,0011) US Columns
    if (tag.Columns) {
        dicomData.dict["00280011"] = { vr: "US", Value: [tag.Columns] };
    }
    // (0028,0100) US BitsAllocated
    if (tag.BitsAllocated) {
        dicomData.dict["00280100"] = { vr: "US", Value: [tag.BitsAllocated] };
    }
    // (0028,0101) US BitsStored
    if (tag.BitsStored) {
        dicomData.dict["00280101"] = { vr: "US", Value: [tag.BitsStored] };
    }
    // (0028,0102) US HighBit
    if (tag.HighBit) {
        dicomData.dict["00280102"] = { vr: "US", Value: [tag.HighBit] };
    }
    // (0028,0103) US PixelRepresentation
    if (tag.PixelRepresentation) {
        dicomData.dict["00280103"] = { vr: "US", Value: [tag.PixelRepresentation] };
    }
    // (0028,0106) US SmallestImagePixelValue
    if (tag.SmallestImagePixelValue) {
        dicomData.dict["00280106"] = { vr: "US", Value: [tag.SmallestImagePixelValue] };
    }
    // (0028,0107) US LargestImagePixelValue
    if (tag.LargestImagePixelValue) {
        dicomData.dict["00280107"] = { vr: "US", Value: [tag.LargestImagePixelValue] };
    }
    // (0028,1050) DS WindowCenter
    if (tag.WindowCenter) {
        dicomData.dict["00281050"] = { vr: "DS", Value: [tag.WindowCenter] };
    }
    // (0028,1051) DS WindowWidth
    if (tag.WindowWidth) {
        dicomData.dict["00281051"] = { vr: "DS", Value: [tag.WindowWidth] };
    }
    // (0032,1033) LO RequestingService
    if (tag.RequestingService) {
        dicomData.dict["00321033"] = { vr: "LO", Value: [tag.RequestingService] };
    }
    // (7FE0,0010) OW|OB PixelData
    if (tag.PixelData) {
        dicomData.dict["7FE00010"] = { vr: "OW", Value: tag.PixelData };
    }
    console.log(tag.ContentSequence)
    // if (tag.ContentSequence){
    //     dicomData.dict["0040A730"] = {vr: "SQ", Value: }
    // }

    // prevenotics private tag
    if (tag.Prevenotics) {
        dicomData.dict['00770010'] = { vr: 'SH', Value: ['prevenotics private tag'] };
        if (tag.Prevenotics.landmark) {
            dicomData.dict['00770011'] = { vr: 'SH', Value: [`landmark : ${tag.Prevenotics.landmark}`] };
        }
        if (tag.Prevenotics.abnormality) {
            dicomData.dict['00770012'] = { vr: 'SH', Value: [`abnormality : ${tag.Prevenotics.abnormality}`] };
        }
        if (tag.Prevenotics.im) {
            dicomData.dict['00770020'] = { vr: 'SH', Value: [`im : ${tag.Prevenotics.im}`] };
        }
    }

    const buffer = Buffer.from(dicomData.write());

    fs.mkdirSync(savePath, { recursive: true });
    fs.writeFileSync(`${savePath}/${imageName}.dcm`, buffer);
};

module.exports = createDicom;
