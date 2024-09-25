const iconv = require('iconv-lite');
const dotenv = require('dotenv');
dotenv.config();

const createDicom = require('./create_dicom');
const { inputPath } = require('../config');

const dcmjsDimse = require('dcmjs-dimse');
const { Dataset, Scp } = dcmjsDimse;
const { CEchoResponse, CFindResponse, CStoreResponse } = dcmjsDimse.responses;
const {
    Status,
    PresentationContextResult,
    UserIdentityType,
    RejectResult,
    RejectSource,
    RejectReason,
    TransferSyntax,
    SopClass,
    StorageClass,
} = dcmjsDimse.constants;



class DcmjsDimseScp extends Scp {
    static studyList = [];
    constructor(socket, opts) {
        super(socket, opts);
        this.association = undefined;
    }

    // Handle incoming association requests
    associationRequested(association) {
        this.association = association;

        // Evaluate calling/called AET and reject association, if needed
        // if (this.association.getCallingAeTitle() !== 'MDQR') {
        //   this.sendAssociationReject(RejectResult.Permanent, RejectSource.ServiceUser, RejectReason.CallingAeNotRecognized);
        //   return;
        // }

        // Optionally set the preferred max PDU length
        this.association.setMaxPduLength(65536);

        const contexts = association.getPresentationContexts();
        // const chart = association.get
        contexts.forEach((c) => {
            const context = association.getPresentationContext(c.id);
            if (
                // sop class
                context.getAbstractSyntaxUid() === SopClass.Verification ||
                context.getAbstractSyntaxUid() ===
                SopClass.StudyRootQueryRetrieveInformationModelFind ||
                context.getAbstractSyntaxUid() ===
                SopClass.ModalityWorklistInformationModelFind ||
                context.getAbstractSyntaxUid() ===
                SopClass.ModalityPerformedProcedureStep ||
                context.getAbstractSyntaxUid() ===
                SopClass.StudyRootQueryRetrieveInformationModelMove ||
                context.getAbstractSyntaxUid() ===
                SopClass.StudyRootQueryRetrieveInformationModelGet ||
                context.getAbstractSyntaxUid() ===
                SopClass.StorageCommitmentPushModel ||
                context.getAbstractSyntaxUid() === SopClass.BasicFilmSession ||
                context.getAbstractSyntaxUid() === SopClass.PrintJob ||
                context.getAbstractSyntaxUid() === SopClass.BasicAnnotationBox ||
                context.getAbstractSyntaxUid() === SopClass.Printer ||
                context.getAbstractSyntaxUid() ===
                SopClass.PrinterConfigurationRetrieval ||
                context.getAbstractSyntaxUid() ===
                SopClass.BasicGrayscalePrintManagementMeta ||
                context.getAbstractSyntaxUid() ===
                SopClass.BasicColorPrintManagementMeta ||
                context.getAbstractSyntaxUid() === SopClass.BasicFilmBox ||
                context.getAbstractSyntaxUid() === SopClass.PresentationLut ||
                context.getAbstractSyntaxUid() === SopClass.BasicGrayscaleImageBox ||
                context.getAbstractSyntaxUid() === SopClass.BasicColorImageBox ||
                context.getAbstractSyntaxUid() ===
                SopClass.InstanceAvailabilityNotification ||
                // storage class
                context.getAbstractSyntaxUid() === StorageClass.BasicTextSrStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.BreastProjectionXRayImageStorageForPresentation ||
                context.getAbstractSyntaxUid() ===
                StorageClass.BreastProjectionXRayImageStorageForProcessing ||
                context.getAbstractSyntaxUid() ===
                StorageClass.BreastTomosynthesisImageStorage ||
                context.getAbstractSyntaxUid() === StorageClass.ChestCadSrStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.ComprehensiveSrStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.ComputedRadiographyImageStorage ||
                context.getAbstractSyntaxUid() === StorageClass.CtImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.DigitalIntraOralXRayImageStorageForPresentation ||
                context.getAbstractSyntaxUid() ===
                StorageClass.DigitalIntraOralXRayImageStorageForProcessing ||
                context.getAbstractSyntaxUid() ===
                StorageClass.DigitalMammographyXRayImageStorageForPresentation ||
                context.getAbstractSyntaxUid() ===
                StorageClass.DigitalMammographyXRayImageStorageForProcessing ||
                context.getAbstractSyntaxUid() ===
                StorageClass.DigitalXRayImageStorageForPresentation ||
                context.getAbstractSyntaxUid() ===
                StorageClass.DigitalXRayImageStorageForProcessing ||
                context.getAbstractSyntaxUid() ===
                StorageClass.EncapsulatedCdaStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.EncapsulatedPdfStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.EnhancedCtImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.EnhancedMrImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.EnhancedPetImageStorage ||
                context.getAbstractSyntaxUid() === StorageClass.EnhancedSrStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.EnhancedXaImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.EnhancedXrfImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.IntravascularOpticalCoherenceTomographyImageStorageForPresentation ||
                context.getAbstractSyntaxUid() ===
                StorageClass.IntravascularOpticalCoherenceTomographyImageStorageForProcessing ||
                context.getAbstractSyntaxUid() ===
                StorageClass.LegacyConvertedEnhancedCTImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.LegacyConvertedEnhancedMRImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.LegacyConvertedEnhancedPETImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.MammographyCadSrStorage ||
                context.getAbstractSyntaxUid() === StorageClass.MrImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.MultiframeGrayscaleByteSecondaryCaptureImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.MultiframeGrayscaleWordSecondaryCaptureImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.MultiframeSingleBitSecondaryCaptureImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.MultiframeTrueColorSecondaryCaptureImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.NuclearMedicineImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.OphthalmicOpticalCoherenceTomographyEnFaceImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.OphthalmicPhotography16BitImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.OphthalmicPhotography8BitImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.OphthalmicTomographyImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.PositronEmissionTomographyImageStorage ||
                context.getAbstractSyntaxUid() === StorageClass.RtImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.SecondaryCaptureImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.UltrasoundImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.UltrasoundMultiframeImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VideoEndoscopicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VideoMicroscopicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VideoPhotographicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VlEndoscopicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VlMicroscopicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VlPhotographicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VlSlideCoordinatesMicroscopicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.VlWholeSlideMicroscopyImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.WideFieldOphthalmicPhotography3dCoordinatesImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.WideFieldOphthalmicPhotographyStereographicProjectionImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.XRay3dAngiographicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.XRay3dCraniofacialImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.XRayAngiographicImageStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.XRayRadiationDoseSRStorage ||
                context.getAbstractSyntaxUid() ===
                StorageClass.XRayRadiofluoroscopicImageStorage
                // Accept other presentation contexts, as needed
            ) {
                const transferSyntaxes = context.getTransferSyntaxUids();
                transferSyntaxes.forEach((transferSyntax) => {
                    if (
                        transferSyntax === TransferSyntax.ImplicitVRLittleEndian ||
                        transferSyntax === TransferSyntax.ExplicitVRLittleEndian ||
                        transferSyntax === TransferSyntax.DeflatedExplicitVRLittleEndian ||
                        transferSyntax === TransferSyntax.ExplicitVRBigEndian ||
                        transferSyntax === TransferSyntax.RleLossless ||
                        transferSyntax === TransferSyntax.JpegBaseline ||
                        transferSyntax === TransferSyntax.JpegLossless ||
                        transferSyntax === TransferSyntax.JpegLsLossless ||
                        transferSyntax === TransferSyntax.JpegLsLossy ||
                        transferSyntax === TransferSyntax.Jpeg2000Lossless ||
                        transferSyntax === TransferSyntax.Jpeg2000Lossy
                    ) {
                        context.setResult(PresentationContextResult.Accept, transferSyntax);
                    } else {
                        context.setResult(PresentationContextResult.RejectTransferSyntaxesNotSupported);
                    }
                });
            } else {
                context.setResult(PresentationContextResult.RejectAbstractSyntaxNotSupported);
            }
        });
        this.sendAssociationAccept();
    }

    // Handle incoming C-ECHO requests
    cEchoRequest(request, callback) {
        const response = CEchoResponse.fromRequest(request);
        response.setStatus(Status.Success);
        callback(response);
    }

    // Handle incoming C-FIND requests
    // cFindRequest(request, callback) {
    //   console.log(request.getDataset());

    //   const pendingResponse = CFindResponse.fromRequest(request);
    //   pendingResponse.setDataset(new Dataset({ PatientID: '12345', PatientName: 'JOHN^DOE' }));
    //   pendingResponse.setStatus(Status.Pending);

    //   const finalResponse = CFindResponse.fromRequest(request);
    //   finalResponse.setStatus(Status.Success);

    //   callback([pendingResponse, finalResponse]);
    // }

    // Handle incoming C-STORE requests
    async cStoreRequest(request, callback) {
        const dataset = request.getDataset();
        const tag = dataset.elements;
        if (dataset.transferSyntaxUid) tag.TransferSyntaxUID = dataset.transferSyntaxUid;
        if (tag.PatientName) tag.PatientName = tag.PatientName[0];
        if (tag.SOPInstanceUID) tag.MediaStorageSOPInstanceUID = tag.SOPInstanceUID;
        if (tag.OperatorsName && tag.OperatorsName.length !== 0) tag.OperatorsName = tag.OperatorsName[0];

        // const savePath = path.join(inputPath, tag.PatientID, tag.StudyInstanceUID);
        const imageName = tag.SOPInstanceUID;


        if (!tag.SpecificCharacterSet || tag.SpecificCharacterSet !== "ISO_IR 192") { //if(encodingType === 'euc-kr') {
            if (tag.InstitutionName) {
                const encoded = Array.from(tag.InstitutionName, (char) => char.charCodeAt(0));
                tag.InstitutionName = iconv.decode(encoded, "euc-kr");
            }
            if (tag.StudyDescription) {
                const encoded = Array.from(tag.StudyDescription, (char) => char.charCodeAt(0));
                tag.StudyDescription = iconv.decode(encoded, "euc-kr");
            }
            if (tag.SeriesDescription) {
                const encoded = Array.from(tag.SeriesDescription, (char) => char.charCodeAt(0));
                tag.SeriesDescription = iconv.decode(encoded, "euc-kr");
            }
            if (tag.OperatorsName && tag.OperatorsName.length !== 0) {
                const encoded = Array.from(tag.OperatorsName.Alphabetic, (char) => char.charCodeAt(0));
                tag.OperatorsName.Alphabetic = iconv.decode(encoded, "euc-kr");
            }
            if (tag.PatientName) {
                const encoded = Array.from(tag.PatientName.Alphabetic, (char) => char.charCodeAt(0));
                tag.PatientName.Alphabetic = iconv.decode(encoded, "euc-kr");
            }
        }

        if (typeof tag.PatientID === 'object') {
            tag.PatientID = tag.PatientID[0].Alphabetic;
        }


        createDicom(tag, inputPath + '/' + tag.StudyInstanceUID, imageName);


        const response = CStoreResponse.fromRequest(request);
        response.setStatus(Status.Success);
        callback(response);
    }

    // Handle incoming association release requests
    async associationReleaseRequested() {
        DcmjsDimseScp.studyList.length = 0;
        this.sendAssociationReleaseResponse();
        // await routing(folderPath, tag);

    }
}

module.exports = DcmjsDimseScp;