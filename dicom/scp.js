const iconv = require('iconv-lite');
const dotenv = require('dotenv');
dotenv.config();

const createDicom = require('./create_dicom');
const { inputPath } = require('../config');

const { Study, Current, Waiting } = require('../db');

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

const acceptSopClass = Object.values(SopClass);
const acceptStorageClass = Object.values(StorageClass);
const acceptTransferSyntax = Object.values(TransferSyntax);

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
            const transferSyntaxes = context.getTransferSyntaxUids();
            transferSyntaxes.forEach((transferSyntax) => {
            context.setResult(PresentationContextResult.Accept, transferSyntax);
            });
        });
        // 인피니티 무한 제안으로 모두 Accept로 변경
        //   const context = association.getPresentationContext(c.id);
        //   // image의 context(이미지 타입)이 라이브러리 범주 내에서 허용하는지?
        //   if (acceptSopClass.includes(context.getAbstractSyntaxUid()) || acceptStorageClass.includes(context.getAbstractSyntaxUid())) {
        //     const transferSyntaxes = context.getTransferSyntaxUids();
        //     // image의 transfer(압축방식)이 라이브러리 범주 내에서 허용하는지?
        //     transferSyntaxes.forEach((transferSyntax) => {
        //       if (acceptTransferSyntax.includes(transferSyntax)) {
        //         context.setResult(PresentationContextResult.Accept, transferSyntax);
        //       } else {
        //         // 
        //         context.setResult(PresentationContextResult.RejectTransferSyntaxesNotSupported); // 인피니티 무한 제안으로 모두 Accept로 변경
        //       }
        //     });
        //   } else {
        //     context.setResult(PresentationContextResult.RejectAbstractSyntaxNotSupported);
        //   }
        // });
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

        try{
            console.log(tag.SOPClassUID)
            console.log(dataset.transferSyntaxUid)
            if (acceptStorageClass.includes(tag.SOPClassUID)) {
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
        
        
                if(typeof tag.OperatorsName === 'object' && !Array.isArray(tag.OperatorsName) && tag.OperatorsName !== null){
                    if('Alphabetic' in tag.OperatorsName){
                        const studyData = await Study.findOne({where: {study_instance_uid : tag.StudyInstanceUID}});
                        if(studyData && !studyData.operators_name){
                            console.log('exist operators name')
                            studyData.operators_name = tag.OperatorsName.Alphabetic;
                            await studyData.save();
                        }
                    }
                }
                createDicom(tag, inputPath, imageName);
            }
        }catch(error){
            const currentDateTime = new Date().toLocaleString();
            console.error(`[${currentDateTime}] ${error}`);
        }


        // createDicom(tag, inputPath + '/' + tag.StudyInstanceUID, imageName);

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