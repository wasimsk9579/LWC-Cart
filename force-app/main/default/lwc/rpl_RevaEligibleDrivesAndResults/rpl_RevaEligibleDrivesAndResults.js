import { LightningElement, wire, track } from 'lwc';
import { getRecord, getFieldValue } from "lightning/uiRecordApi"
import { ShowToastEvent } from 'lightning/platformShowToastEvent';
import { refreshApex } from '@salesforce/apex';
import CONTACT_ID from "@salesforce/schema/User.ContactId";
import USER_ID from "@salesforce/user/Id";
import getAllEligibleDrives from '@salesforce/apex/RPL_StudentRegisterDriveController.getAllEligibleDrives';
import getAttachmentContent from '@salesforce/apex/RPL_StudentRegisterDriveController.getAttachmentContent';
import updateIsApplied from '@salesforce/apex/RPL_StudentRegisterDriveController.updateIsApplied';
import LightningConfirm from 'lightning/confirm';
import generateAdmitCard from '@salesforce/apex/RPL_AdmitCardTemplateController.generateAdmitCard';
import {NavigationMixin} from 'lightning/navigation';


export default class Rpl_RevaEligibleDrivesAndResults extends NavigationMixin(LightningElement) {
isOfferUpload = false;
data;
error;
contactId;
wiredEligibleDrives;
isDriveAvailable;
studentRegDriveId;
isResult;
isEligibleDrives = true;
isSpinner = false;


    handleStepClick(event){
        const stepNumber = event.target.dataset.step;
        
        if(stepNumber == 1){
            this.isEligibleDrives = true;
            this.isResult = false;
            this.updateStyles(stepNumber);
        }else if(stepNumber == 2){
                  this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Click On Drive Name',
                    message: `Please Click On Drive Name To See It's Respective Recruitment Stages And Result`,
                    variant: 'info',
                    })
            )
          /*   this.isResult = true;
            this.isEligibleDrives = false; */
        }
    }

    handleGetJobDescription(event){
               let jobDescriptionURL = event.target.dataset.url;
                this[NavigationMixin.Navigate]({
                    type: 'standard__webPage',
                    attributes: {
                         url: jobDescriptionURL
                    }
                });                
            }

    

        updateStyles(stepNumber){
        const tabs = this.template.querySelectorAll('.tab');
        tabs.forEach(tab => {
            const tabStepNumber = tab.dataset.step;
            if(tabStepNumber!=stepNumber){
                tab.style.color = 'black';
                tab.style.backgroundColor = '#FEF3EA';
            }else{
                tab.style.color = 'white';
                tab.style.backgroundColor = '#f07f07';
            }
        })
    }

@wire(getRecord, { recordId: USER_ID, fields: [CONTACT_ID] })
userec({ error, data }) {
    if (error) {
    this.error = error;
    console.error('Error', error);
    } else if (data) {
    this.contactId = data.fields[CONTACT_ID.fieldApiName].value;

    }
} 
 @wire(getAllEligibleDrives, ({ contactId: '$contactId' }))
fetchAllEligibleDrive(result){
    this.wiredEligibleDrives = result;
    if(result.data){
        this.data = result.data.map(drive => {
            console.log('Eligible Drives Image ' +drive.Rpl_Placement_Drive__r.Rpl_Company_Name__r.Company_Image__c);
            var currentDate = new Date();
            var currentHour = currentDate.getHours();
            var currentMinute = currentDate.getMinutes();
            var totalMilliseconds =  drive.Rpl_Placement_Drive__r.Rpl_Application_End_Time__c ?  drive.Rpl_Placement_Drive__r.Rpl_Application_End_Time__c : 0;
            var appEndHour = Math.floor((totalMilliseconds / (1000 * 60 * 60)) % 24);
            var appEndMinute = Math.floor((totalMilliseconds / (1000 * 60)) % 60);
            var driveEndDate = new Date(drive.Rpl_Placement_Drive__r.Rpl_Event_End_Date__c);
            let applyLabel = '';
            let isApplied = true; 
            let isDownloadDisable = true;
            let companyName = {name : drive.Rpl_Placement_Drive__r.Rpl_Company_Name__r.Company_Image__c ? drive.Rpl_Placement_Drive__r.Rpl_Company_Name__r.Company_Image__c : (drive.Rpl_Placement_Drive__r && drive.Rpl_Placement_Drive__r.Rpl_Company_Name__r) ? drive.Rpl_Placement_Drive__r.Rpl_Company_Name__r.Name : undefined, isImageRender : false};
            
            let tempDiv = document.createElement('div');
            tempDiv.innerHTML = companyName.name;

            let imgElement = tempDiv.querySelector('img');

            if (imgElement) {
                companyName.name = imgElement.getAttribute('src');
                console.log(companyName.name );
                companyName.isImageRender = true;
            } else {
                console.log('img element not found.');
            }

           console.log('Company Name ' + JSON.stringify(companyName));
            if (drive.Rpl_IsApplied__c) {
                applyLabel = 'Applied';
                isApplied = true;
                isDownloadDisable = false;
            } else if (!drive.Rpl_IsApplied__c && drive.Rpl_Placement_Drive__r && drive.Rpl_Placement_Drive__r.Rpl_Event_End_Date__c) {
                // Check if Rpl_Event_End_Date__c is defined before accessing its properties
                if (new Date(drive.Rpl_Placement_Drive__r.Rpl_Event_Date__c) > new Date()) {
                    applyLabel = 'Apply';
                    isApplied = true; 
                    isDownloadDisable = true;
                }else if (currentDate.getDate() > driveEndDate.getDate() || (currentDate.getDate()==driveEndDate.getDate() && (currentHour > appEndHour || (currentHour === appEndHour && currentMinute >= appEndMinute)))){
                    applyLabel = 'Closed';
                    isApplied = true;
                    isDownloadDisable = true;
                }
                
                else {
                    console.log('Inside Else')
                    applyLabel = 'Apply';
                    isApplied = false; 
                    isDownloadDisable = true;                   
                }
            } else {
                applyLabel = 'Apply';
                isApplied = false;
                isDownloadDisable = true;
            }

            //If the student is blocked then we disable the Apply button.
            isApplied = (drive.Rpl_Student_Registration__r.Rpl_Is_Blocked__c)? true : isApplied;
            applyLabel = (drive.Rpl_Student_Registration__r.Rpl_Is_Blocked__c)?'Blocked':applyLabel;

            return {
                id: drive.Id,
                isUploadDisabled : !drive.Rpl_Is_Offered__c,
                studentRegId: drive.Rpl_Student_Registration__c,
                driveId: drive.Rpl_Placement_Drive__c,
                driveName: (drive.Rpl_Placement_Drive__r) ? drive.Rpl_Placement_Drive__r.Name : undefined,
                companyName,
/*                 companyName: (drive.Rpl_Placement_Drive__r && drive.Rpl_Placement_Drive__r.Rpl_Company_Name__r) ? drive.Rpl_Placement_Drive__r.Rpl_Company_Name__r.Name : undefined,
 */                eventStartDate: (drive.Rpl_Placement_Drive__r && drive.Rpl_Placement_Drive__r.Rpl_Event_Date__c) ? new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }).format(new Date(drive.Rpl_Placement_Drive__r.Rpl_Event_Date__c)) : undefined,
                eventEndDate: (drive.Rpl_Placement_Drive__r && drive.Rpl_Placement_Drive__r.Rpl_Event_End_Date__c ) ? new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                }).format(new Date(drive.Rpl_Placement_Drive__r.Rpl_Event_End_Date__c)) : undefined,
                isApplied : isApplied,
                jobDescriptionURL : drive.Rpl_Placement_Drive__r.Rpl_Job_Description_URL__c ?  drive.Rpl_Placement_Drive__r.Rpl_Job_Description_URL__c : '',
                isJobDescriptionPreviewDisabled : drive.Rpl_Placement_Drive__r.Rpl_Job_Description_URL__c ? false : true,
                applyLabel : applyLabel,
                personalEmailId : (drive.Rpl_Student_Registration__r && drive.Rpl_Student_Registration__r.Rpl_Personal_Mail_ID__c) ? drive.Rpl_Student_Registration__r.Rpl_Personal_Mail_ID__c : '',
                isDownloadDisable : isDownloadDisable,
                eventDate: (drive.Rpl_Placement_Drive__r.Rpl_Event_Date_Time__c) ? new Intl.DateTimeFormat('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                }).format(new Date(drive.Rpl_Placement_Drive__r.Rpl_Event_Date_Time__c)) : undefined,
               
            };
        });
        this.isDriveAvailable = (this.data.length > 0)?true:false;
    }
    else if(result.error){  
        
        this.error= result.error;
    }
}

 get acceptedFormats() {
        return ['.pdf', '.png'];
    }

    handleUploadFinished(event) {
        this.isOfferUpload = false;
        // Get the list of uploaded files
        this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Uploaded Successfully',
                    message: `Offer Letter Uploaded Successfully`,
                    variant: 'success',
                    })
            )
    }

applyHandler(event){
    let rowId = event.target.dataset.id;
    let selectedRow = this.data.find(row => row.id == rowId);
    this.showConfirmModal(selectedRow);
}
downloadHandler(event){
    let rowId = event.target.dataset.id;
    let selectedRow = this.data.find(row => row.id == rowId);
    this.showConfirmDownloadModule(selectedRow);
}
uploadHandler(event){
    let rowId = event.target.dataset.id;
    this.studentRegDriveId = rowId;
    this.handleUpload();
}
viewResultHandler(event){
    this.updateStyles(2);
    let rowId = event.target.dataset.id;
    this.studentRegDriveId = rowId;
    this.isResult = true;
    this.isEligibleDrives = false;
}

handleModalClose(){
    this.isOfferUpload = false;
}
handleUpload(){
    this.isOfferUpload = !this.isOfferUpload;     
}

async showConfirmDownloadModule(row) {
    const result = await LightningConfirm.open({
        message: 'Are you sure you want to download admit card this drive?',
        variant: 'headerless',
        label: 'Download',
        header: 'Download Confirmation', // Optional header for the modal
        type: 'success', // Optional type (error, warning, info), affects the icon
        
    });
    if (result) {
        this.getAttachmentContentFromStudentRegDrive(row.id);
      
    } else {
        // User clicked Cancel, do nothing
    }
}

async showConfirmModal(row) {
    const result = await LightningConfirm.open({
        message: 'Are you sure you want to apply for this drive?',
        variant: 'headerless',
        label: 'Apply',
        header: 'Apply Confirmation', // Optional header for the modal
        type: 'warning', // Optional type (error, warning, info), affects the icon
    });
    if (result) {
       this.updateIsAppliedCheckBox(row.id,  row.driveName, row);
       
    } else {
        // User clicked Cancel, do nothing
    }
}   
updateIsAppliedCheckBox(studentRegistrationDriveId, driveName, row){
    this.isSpinner= true;
    updateIsApplied({studentRegistrationDriveId : studentRegistrationDriveId})
    .then(result => {
        if(result === 'true'){      
            this.generateAndSendAdmitCard(row.id, row.driveName, row.personalEmailId);      
            
           // this.isSpinner= false;
            refreshApex(this.wiredEligibleDrives);            
        }
        else{
            this.isSpinner = false;
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Apply Failed',
                    message: `Your Application For The Drive : ${driveName} Was Failed`,
                    variant: 'warning',
                    })
            )
        }           
    })
    .catch(error =>{
        this.isSpinner = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Apply Failed',
                message: error,
                variant: 'warning',
                })
        )
    })
}

generateAndSendAdmitCard(studentRegDriveId , driveName, personalEmailId){
    generateAdmitCard({studentRegDriveId : studentRegDriveId, personalEmailId:personalEmailId})
    .then(res =>{
        this.isSpinner = false;
        this.dispatchEvent(
                new ShowToastEvent({
                    title: 'Applied Successfully',
                    message: `You Have Been Applied For The Drive : ${driveName}`,
                    variant: 'success',
                    })
            )
    })
    .catch(error => {
        this.isSpinner = false;
        this.dispatchEvent(
            new ShowToastEvent({
                title: 'Admit Card Generation Failed',
                //message: error.body.message,
                variant: 'warning',
                })
        )
    })
}

getAttachmentContentFromStudentRegDrive(studentRegistrationDriveId){
    getAttachmentContent({studentRegistrationDriveId : studentRegistrationDriveId })
    .then(res => {
        if(res.Body != null){
            this.downloadPDF(res);
        }
        else{
            this.dispatchEvent(
                new ShowToastEvent({
                    title: 'No Admit Card To Download',
                    //message: error.body.message,
                    variant: 'warning',
                    })
            )
        }       
    })
    .catch(err => 'Error '+err)
}

downloadPDF(pdf) {
    const blob = this.base64ToBlob(pdf.Body);
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = pdf.Name;
    link.click();
}

base64ToBlob(base64) {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    return new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
}
}