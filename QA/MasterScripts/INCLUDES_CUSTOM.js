/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_CUSTOM.js
| Event   : N/A
|
| Usage   : Custom Script Include.  Insert custom EMSE Function below and they will be 
|	available to all master scripts
|
| Notes   :
|
/------------------------------------------------------------------------------------------------------*/
function logDebug(dstr) {
logCustom(dstr, initializeLog);
	vLevel = 1;
	if (arguments.length > 1)
		vLevel = arguments[1];
	if ((showDebug & vLevel) == vLevel || vLevel == 1)
		debug += dstr + br;
	if ((showDebug & vLevel) == vLevel)
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr);			
}
function logCustom(dstr, initialize)
{
	//Initialize DateTime
	var dateObj = new Date();
	var timeStamp = "";
	var logString = "";

	//if initialize then it is first entry of the event
	if (initialize)
	{
		//change the initialize flag to prevent infinite loop
		initializeLog = false;
		
		//Log initial header. Order is important and all entries must be present even if empty or null
		logString = logCustomHeader();

		//Log commercial activities
		logString += logCustomActivities();

		//Log ASI
		logString += logCustomASI();

		//Log Address if any
		logString += logCustomAddress();

		//Log partners
		logString += logCustomPartners();

	}

    //Get DateTime
	dateObj = new Date();
	timeStamp = dateFormat(dateObj, "DD/MM/YYYY HH:MM:SS");
	//aa.util.writeToFile(logString + timeStamp + " : "  + dstr + " !| ", mslogDir);
	//Removed payload
	if(logString.length > 0)
	{
		aa.util.writeToFile(logString + timeStamp + " !| ", mslogDir);
	}
	
}

function logCustomPartners()
{
	//If not capId then its ASB and we can just return
	if (!capId) return;

	var capContactArray = aa.people.getCapContactByCapID(capId).getOutput();
	var contString = "";

	for (var cont in capContactArray)
	{
		//Get name
		var thisCont = capContactArray[cont];
		contString += "Partner: ";
		contString = contString + thisCont.getPeople().getFirstName() + " " + thisCont.getPeople().getFullName() + " " +
		thisCont.getPeople().getMiddleName() + " " + thisCont.getPeople().getLastName() + " !| ";

		//Get contact type
		contString = contString + "Partner contact type: " + thisCont.getPeople().getContactType() + " !| ";

		//Get Attributes
		contAttribs = thisCont.getPeople().getAttributes().toArray();
		var attribString = "";
		for (var att in contAttribs)
		{
			var thisAttrib = contAttribs[att];
			attribString = attribString + "Contact Attribute " + thisAttrib.attributeName + " : " + thisAttrib.attributeValue + " !| ";

		}

		//Concat the strings
		contString = contString + attribString;
	}

	return contString;
}
function logCustomAddress()
{
	var address = aa.address.getAddressWithAttributeByCapId(capId).getOutput();
	var addressString = "";

	if (address && address.length > 0)
	{
		
		addressString = address[0].getCity() +  " " + address[0].getAddressLine1() +  " " +  address[0].getAddressLine2() +  " " +
		address[0].getNeighborhood() +  " " + address[0].getSecondaryRoad();
		//aa.util.writeToFile("Address: " + addressString + " !| ", mslogDir);
	}

	return addressString;
}
function logCustomASI()
{
    var customASIString = "";

	for (var asi in AInfo)
	{
		customASIString += "ASI " + asi + " = " + AInfo[asi] + " !| ";
	}
	
	return customASIString;
}
function logCustomHeader()
{
		//Get date
		var dateObj = new Date();
		var timeStamp = dateFormat(dateObj, "DD/MM/YYYY HH:MM:SS");

		//Log User type
		var userType = "Internal User";
		var currUser = aa.env.getValue("CurrentUserID");

		if (currUser && currUser.indexOf("PUBLIC") > -1)
		{
			userType = "Internet User";
		}
		else if (currUser && currUser.indexOf("MOBILE") > -1)
		{
			userType = "Mobile App";
		}

		//Log userGroup
		var currentUserGroup;
		var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput();
		if (currentUserGroupObj)
		{
			currentUserGroup = currentUserGroupObj.getGroupName();
		}

		//Set event Description
		var eventDes = "";
		switch(controlString)
		{
			case "WorkflowTaskUpdateAfter":
			case "WorkflowTaskUpdateBefore":
			eventDes = wftuDes;
			break;

			case "ApplicationSubmitAfter":
			case "ApplicationSubmitAfterStart":
			case "ApplicationSubmitBefore":
			eventDes = asDes;
			break;
		
			default:
			eventDes = "";
			break;
		}

        var customHeaderString = "\n" + timeStamp +
			" !| Event Name: " + aa.env.getValue("EventName") +
			" !| Username : " + aa.env.getValue("CurrentUserID") +
			" !| User Group: " + currentUserGroup +
			" !| User Full Name: " + aa.env.getValue("StaffFirstName") + " " + aa.env.getValue("StaffLastName") +
			" !| User Type: " + userType +
			" !| " + "Event Category: " + appTypeString +
			" !| " + "Event description: " + eventDes +
			" !| ";
		
		return customHeaderString;
}

function logCustomActivities()
{
    var customActivitiesString = "";

	if (!"ApplicationSubmitBefore".equals(controlString))
	{
		comActs = loadASITable("COMMERCIAL ACTIVITIES");
		
		if ("object".equals(typeof(comActs)) && comActs.length > 0)
		{
			for(var x in comActs)
			{
			    customActivitiesString += "Commercial Activity: " + comActs[x]["Name"] + " !| ";
			}
		}
	}

	return customActivitiesString;
}

//Functions for WorkflowTaskUpdateBefore////////////////////////////////////////////////////////////////////////////////
function compareDate(date1,date2)
{
    year = date1.getYear()-date2.getYear();
    month = date1.getMonth() -date2.getMonth();
     day = date1.getDayOfMonth()- date2.getDayOfMonth();
aa.print("date1.getMonth()=="+date1.getMonth()+"date2.getMonth()=="+date2.getMonth());

aa.print("date1.getDayOfMonth()=="+date1.getDayOfMonth()+"date2.getDayOfMonth()=="+date2.getDayOfMonth());
   if(year >0)
   {
     return true;

   }else if(month>0)
   {
      return  true;
   }else if(day>0)
   {
      return true;
   }

   return false;

}
function getRenewalCapForIncomplete(pParentCapId)
{
    if (pParentCapId== null || aa.util.instanceOfString(pParentCapId))
    {
    }
    var result = aa.cap.getProjectByChildCapID(pParentCapId, "Renewal", "Incomplete");
    if(result.getSuccess())
    {
      projectScriptModels = result.getOutput();
      if (projectScriptModels == null || projectScriptModels.length == 0)
      {
        aa.print("WARNING: Failed to get renewal CAP by child CAPID(" + pParentCapId+ ") for incomplete");
        return null;
      }
      projectScriptModel = projectScriptModels[0];
      return projectScriptModel;
    }
    else 
    {
      logDebug("WARNING: Failed to get renewal CAP by child CAP(" + pParentCapId+ ") for incomplete: " + result.getErrorMessage());
      return null;
    }
}
function invoiceAEFees()
    {
    //invoices all assessed fees having fperiod, optional fee code(s) to exclude

	
       var invFeeSeqList = new Array();
	var invPaymentPeriodList = new Array();


	var skipArray = new Array();
	var invoiceAll = false;
	if (arguments.length > 0)
		{
		for (var i=0; i<arguments.length; i++)
			skipArray.push(arguments[i]);
		}
	else
		invoiceAll = true;


	var feeA = loadFees(capId)
        var deptName = getDepartmentName(currentUserID);
	for (var x in feeA)
		{
		thisFee = feeA[x];
		if (!invoiceAll && (exists(thisFee.accCodeL1,skipArray) || thisFee.code == "AE FEE POST")) continue;

		if ((thisFee.status.equals("NEW") && thisFee.amount*1 > 0)&&thisFee.sched.equals(deptName.toUpperCase()))
			{
			invFeeSeqList.push(thisFee.sequence);
			invPaymentPeriodList.push(thisFee.period);
            logDebug("Assessed fee "+thisFee.code+" found and tagged for invoicing");
            }
        }

	if (invFeeSeqList.length)
		{
		invoiceResult = aa.finance.createInvoice(capId, invFeeSeqList, invPaymentPeriodList);
		if (invoiceResult.getSuccess())
			{
			logDebug("Invoicing assessed fee items is successful.");
			balanceDue = aa.cap.getCapDetail(capId).getOutput().getBalance();
			logDebug("Updated balanceDue to " + balanceDue);
			}
		else
			logDebug("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
		}
              

    }
function updateExpirationStatus(capId)
{
     
    var result = aa.expiration.getLicensesByCapID(capId);
    if(result.getSuccess())
    {
       expirationModels = result.getOutput();
       expiration = expirationModels.getB1Expiration();
      if(expiration)
       {
       tmpDate = expirationModels.getExpDate();

       if(compareDate(tmpDate,sysDate))
       {
         expiration.setExpStatus("About to Expire");

       }
       else
       {
         expiration.setExpStatus("Expired");
       }

       aa.expiration.editB1Expiration(expiration);

              logDebug("Updated renewal to status successfully! "  );                   
       }

         }
}
function getRenewalCapForReview(pParentCapId)
{
    if (pParentCapId== null || aa.util.instanceOfString(pParentCapId))
    {
    }
    var result = aa.cap.getProjectByChildCapID(pParentCapId, "Renewal", "Review");
    if(result.getSuccess())
    {
      projectScriptModels = result.getOutput();
      if (projectScriptModels == null || projectScriptModels.length == 0)
      {
        aa.print("WARNING: Failed to get renewal CAP by child CAPID(" + pParentCapId+ ") for review");
        return null;
      }
      projectScriptModel = projectScriptModels[0];
      return projectScriptModel;
    }  
    else 
    {
      logDebug("WARNING: Failed to get renewal CAP by child CAP(" + pParentCapId+ ") for review: " + result.getErrorMessage());
      return null;
    }
}

function getAENewFees()
{

       var invFeeSeqList = new Array();
	var invPaymentPeriodList = new Array();


	var skipArray = new Array();
	var invoiceAll = false;
	if (arguments.length > 0)
		{
		for (var i=0; i<arguments.length; i++)
			skipArray.push(arguments[i]);
		}
	else
		invoiceAll = true;


	var feeA = loadFees(capId)
        var deptName = getDepartmentName(currentUserID);
	for (var x in feeA)
		{
		var thisFee = feeA[x];
		if (!invoiceAll && (exists(thisFee.accCodeL1,skipArray) || thisFee.code == "AE FEE POST")) continue;

		if ((thisFee.status.equals("NEW") && thisFee.amount*1 > 0)&& thisFee.sched.equals(deptName.toUpperCase()) )
			{
			invFeeSeqList.push(thisFee.sequence);
			invPaymentPeriodList.push(thisFee.period);
            logDebug("Assessed fee "+thisFee.code+" found and tagged for invoicing");
            }
        }
        aa.print("invFeeSeqList==" +invFeeSeqList);

	if (invFeeSeqList.length>0 && invFeeSeqList !=null &&invFeeSeqList != "")
	{
		  return true;
	}
	else
	{
		  return false;
	}
		

}
function ExemptAndApply()
{
	myCapId = capId;
	if (arguments.length > 1) myCapId = arguments[1]; // use cap ID specified in args
	
	feeSeq=[];
	invoiceNbr = [];
	invoices = null;
	paidFeeItemsSeqNbr = [];
		p = aa.finance.createPaymentScriptModel();
		p.setAuditDate(aa.date.getCurrentDate());
		p.setAuditStatus("A");
		p.setCapID(myCapId);
		p.setCashierID(currentUserID);
		p.setPaymentAmount(0);
		p.setPaymentChange(0);
		p.setPaymentComment("Exempt");
		p.setPaymentDate(aa.date.getCurrentDate());
		p.setPaymentMethod("Cash");
		p.setPaymentStatus("Paid");
		paySeq = aa.finance.makePayment(p).getOutput();
		p = aa.finance.getPaymentByPK(myCapId, paySeq, "").getOutput();

		
	invoice = aa.finance.getInvoiceByCapID(myCapId, aa.util.newQueryFormat()).getOutput(); 
	feeItems = aa.finance.getFeeItemByCapID(myCapId).getOutput();
	paidFeeItems = aa.finance.getPaymentFeeItems(myCapId, aa.util.newQueryFormat()).getOutput();
	for(y in paidFeeItems)
	{
		paidFeeItemsSeqNbr.push(paidFeeItems[y].getFeeSeqNbr())
	}
	amountNtAllc = [0];

	for (x in feeItems)
	{
	if(feeItems[x].getFeeitemStatus().equals("CREDITED") && !exists(feeItems[x].getFeeSeqNbr(), paidFeeItemsSeqNbr))
		{
			invoices = aa.finance.getFeeItemInvoiceByFeeNbr(myCapId, feeItems[x].getFeeSeqNbr(), aa.util.newQueryFormat()).getOutput();
			feeItems[x].setFee(0);
			aa.finance.editFeeItem(feeItems[x].getF4FeeItem());
			feeSeq = [feeItems[x].getFeeSeqNbr()];
			invoiceNbr = [invoices[0].getInvoiceNbr()];
			logDebug("Applying feeItem " + feeItems[x].getFeeDescription())
			a = aa.finance.applyPayment(myCapId, p, feeSeq, invoiceNbr, amountNtAllc,"Paid", "Paid", 0);
		}
	}
	aa.finance.generateReceipt(myCapId,aa.date.getCurrentDate(),paySeq,"Exempt - " + currentUserID,null);
}

function addCustomFee(feeSched, feeCode, feeDescr, feeAm, feeAcc) {
    var feeCap = capId;
    var feeAcc3 = null;
    var notes = null;
    if (arguments.length > 5) feeAcc3 = arguments[5];
    if (arguments.length > 6) notes = arguments[6];
    var newFeeResult = aa.finance.createFeeItem(feeCap, feeSched, feeCode, "FINAL", feeAm);
    if (newFeeResult.getSuccess()) {
        var feeSeq = newFeeResult.getOutput();
        var newFee = aa.finance.getFeeItemByPK(feeCap, feeSeq).getOutput().getF4FeeItem();
        newFee.setFeeDescription(feeDescr);
        if (feeAcc) newFee.setAccCodeL1(feeAcc);
        if (feeAcc3) newFee.setAccCodeL3(feeAcc3);
        if (notes) newFee.setFeeNotes(notes);
        aa.finance.editFeeItem(newFee);
    }
}

function addMonthsToDate(startDate, numMonths) {
    var addYears = Math.floor(numMonths / 12);
    var addMonths = numMonths - (addYears * 12);
    var newMonth = startDate.getMonth() + addMonths;
    if (startDate.getMonth() + addMonths > 11) {
        ++addYears;
        newMonth = startDate.getMonth() + addMonths - 12;
    }
    var newDate = new Date(startDate.getFullYear() + addYears, newMonth, startDate.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
    while (newDate.getMonth() != newMonth) {
        newDate = addMonthsToDate(newDate, -1);
    }
    return newDate;
}

function addStdCondition(cType, cDesc) {
    if (!aa.capCondition.getStandardConditions) {} else {
        standardConditions = aa.capCondition.getStandardConditions(cType, cDesc).getOutput();
        for (i = 0; i < standardConditions.length; i++) {
            standardCondition = standardConditions[i];
			aa.capCondition.createCapConditionFromStdCondition(capId, standardCondition.getConditionNbr());
        }
    }
}

function assignTasksToDepartment(assignedDept)
	{
	var doAssignCap = true;
	var itemCap = capId;
	var checkAgency = "DPE";

	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	//
	// Get capdetail
	//
	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }
	var cdScriptObj = cdScriptObjResult.getOutput();
	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }
	cd = cdScriptObj.getCapDetailModel();

	//
	// if newDept is null, assign tasks to either 1) assigned department in cap detail, or 2) department of user
	//
	if (!assignedDept)
		{
		assignedDept = cd.getAsgnDept()
		doAssignCap = false;

		if (!assignedDept)
			{
			doAssignCap = true;
			iNameResult  = aa.person.getUser(currentUserID);
			if (!iNameResult.getSuccess())
				{ logDebug("**ERROR retrieving  user model " + assignId + " : " + iNameResult.getErrorMessage()) ; return false ; }
			iName = iNameResult.getOutput();
			assignedDept = iName.getDeptOfUser();
			}

		if (!assignedDept)
			{ logDebug("**ERROR: Can't determine department to assign"); return false; }

		}

	var assignBureau = "" + assignedDept.split("/")[2];

	//
	// Assign the new department to the CAP, since the cap is unassigned.
	//
	if (doAssignCap)
		{
		cd.setAsgnDept(assignedDept);
		cdWrite = aa.cap.editCapDetail(cd)
		if (!cdWrite.getSuccess())
			{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
		}

	//
	// Loop through all non-completed tasks.  If Agency == DPE  Change bureau to match assigned department
	//

	var workflowResult = aa.workflow.getTasks(itemCap);
	if (!workflowResult.getSuccess())
		{ logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); return false; }

	wfObj = workflowResult.getOutput();
	for (var i in wfObj)
		{
		fTask = wfObj[i];
		if (fTask.getCompleteFlag() != "N") continue;

		var taskUserObj = fTask.getTaskItem().getAssignedUser()

		if (taskUserObj.getAgencyCode() != checkAgency) continue; 		// skip non-DPE tasks
		if (taskUserObj.getBureauCode().equals(assignBureau)) continue;		// already assigned

		taskUserObj.setBureauCode(assignBureau);

		fTask.setAssignedUser(taskUserObj);
		var taskItem = fTask.getTaskItem();
		var adjustResult = aa.workflow.assignTask(taskItem);
		}

	}
function buildWorkflow() {
	/** Constants **/
	var isNew = false;
	var isAmend = false;
	var isRenew = false;
	var isCancel = false;
	var preInspectionRequired = false;
	var bothInspectionRequired = false;
	aeArray = new Array();
	
	/** Load Cap Data **/
		/** get Cap's City ***/
			var capCity = null;
			var addrResult = aa.address.getAddressByCapId(capId); 
			if(addrResult) 
				var addrArray = addrResult.getOutput(); 
			if (addrArray) {
				for (var thisAddr in addrArray) {
					capCity = addrArray[thisAddr].getCity();
					if (addrArray[thisAddr].getUnitType() == "Villa" || addrArray[thisAddr].getUnitType() == "Ware.") preInspectionRequired = true;
					}
				}
							
			//aa.print(capCity);
			if (capCity) {			
				capCity = capCity.trim();
				//set up the capCity to be English only.
				if (capCity.indexOf('أبوظبي') > -1 || capCity.indexOf('Abu Dhabi') > -1 )
					capCity = 'Abu Dhabi';
				else if (capCity.indexOf('العين') > -1 || capCity.indexOf('Al Ain') > -1 )
					capCity = 'Al Ain';
				else if (capCity.indexOf('المنطقة الغربية') > -1 || capCity.indexOf('Western Area') > -1 )
					capCity = 'Western Area';
				logDebug("This Cap has cap City: " + capCity);
			}
		/** End of get Cap's City ***/	
		
		/** Grab LF and Acts **/
		var legalForm = getAppSpecific("Legal Form");
		myActivities = loadASITable("COMMERCIAL ACTIVITIES");
		
		/** Determine Transaction Type **/
		tTypeArray = new Array();
		if (appTypeString.equals("Licenses/License/Amendment/NA")) {
			isAmend = true;
			pcapId = getParent(); 
			pActivities = loadASITable("COMMERCIAL ACTIVITIES", pcapId);
			for (curr in myActivities)
			{
				for (old in pActivities)
				{
					if(pActivities[old]["Activity ID"].fieldValue.equals(myActivities[curr]["Activity ID"].fieldValue))
					{
						myActivities[curr]["Existing"] = true;
					}
				}
			}
			
			if (getAppSpecific("Activity Replacement").substr(0,1) == "Y") tTypeArray.push("Activity Replacement");
			if (getAppSpecific("Capital Amendment").substr(0,1) == "Y") tTypeArray.push("Capital Amendment");
			if (getAppSpecific("Legal Form Amendment").substr(0,1) == "Y") tTypeArray.push("Legal Form Amendment");
			if (getAppSpecific("Signboard Amendment").substr(0,1) == "Y") tTypeArray.push("Signboard Amendment");
			if (getAppSpecific("Location Amendment").substr(0,1) == "Y") tTypeArray.push("Location Amendment");
			if (getAppSpecific("Partners Amendment").substr(0,1) == "Y") tTypeArray.push("Partners Amendment");
			if (getAppSpecific("Sponsor Amendment").substr(0,1) == "Y") tTypeArray.push("Sponsor Amendment");
			if (getAppSpecific("Trade Name Amendment").substr(0,1) == "Y") tTypeArray.push("Trade Name Amendment");
			if (getAppSpecific("Country Amendment (Foreign Company)").substr(0,1) == "Y") tTypeArray.push("Country Amendment (Foreign Company)");
			if (getAppSpecific("License Type Amendment").substr(0,1) == "Y") tTypeArray.push("License Type Amendment");
			if (getAppSpecific("Manager Amendment").substr(0,1) == "Y") tTypeArray.push("Manager Amendment");
			if (getAppSpecific("Heirs Amendment").substr(0,1) == "Y") tTypeArray.push("Heirs Amendment");
			if (getAppSpecific("Partners Nationality Amendment").substr(0,1) == "Y") tTypeArray.push("Partners Nationality Amendment");
			if (getAppSpecific("Partners Shares Amendment").substr(0,1) == "Y") tTypeArray.push("Partners Shares Amendment");
			}
		if (appTypeString.equals("Licenses/License/Renewal/NA")) {
			isRenew = true;
			tTypeArray.push("Trade License Renewal");
			}
		if (appTypeString.equals("Licenses/License/Cancellation/NA")){
			isCancel = true;
			tTypeArray.push("Trade License Cancellation");
			}
		if (appTypeString.equals("Licenses/License/Issue/New")) {
			isNew = true;
			tTypeArray.push("License Issue");
			}
		/** End Transaction Type**/
		
		var workflowResult = aa.workflow.getTasks(capId);
 		if (workflowResult.getSuccess()) var wfObj = workflowResult.getOutput();
  		else { 
			logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; 
		}
		
	/** End Cap Data **/
	
	/** Clean Up Old Data **/
	for (var i in wfObj) {
					fTask = wfObj[i];					
					if (fTask.getTaskDescription().trim().toUpperCase().equals("GENERICCOMMERCIALACTIVITY")) {
						copyWorkflow(capId, capId, "APPROVING ENTITIES","GenericCommercialActivity","Approving Entities","الجهات الخارجية","P") ;
						deleteTask(capId, "GenericCommercialActivity");
						deleteTask(capId, "GenericCommercialActivity2");
						logDebug("Finished Clean Up");
					} 
				}
	
	/** Grab Updated Workflow **/
		var workflowResult = aa.workflow.getTasks(capId);
 		if (workflowResult.getSuccess()) var wfObj = workflowResult.getOutput();
  		else { 
			logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; 
		}
	/** Legal Form **/
	lfCap = aa.cap.getCapID(legalForm).getOutput();
	needInspect = getAppSpecific("Inspection Required",lfCap);
	if (needInspect == "Before") preInspectionRequired = true;
	if (needInspect == "Both") bothInspectionRequired = true;

	lfEntity = loadASITable("APPROVING ENTITIES",lfCap);
	lfCount = 0;
	for (t in tTypeArray) {
		tType = tTypeArray[t];
		for (x in lfEntity) {
			if (lfEntity[x]["Transaction Type"].fieldValue.equals(tType) && 
				lfEntity[x]["Suspended"].fieldValue != "CHECKED" && 
				(!lfEntity[x]["Main Area"].fieldValue || lfEntity[x]["Main Area"] == capCity || lfEntity[x]["Main Area"].fieldValue == "")) {
				
				//Build Required aeArray
				aeArray.push(lfEntity[x]["Approving Entity"].fieldValue);
				logDebug("AE Found for Legal Form: " + lfEntity[x]["Approving Entity"].fieldValue);
				
				//Grab Task
				var foundAE = "";
				for (var i in wfObj) {
					fTask = wfObj[i];					
					if (fTask.getTaskDescription().trim().toUpperCase().equals(lfEntity[x]["Approving Entity"].fieldValue.trim().toUpperCase())) {
					foundAE = fTask;
					} 
				}
				if (!foundAE) {
				logDebug(legalForm + "Task does not Exist: " + lfEntity[x]["Approving Entity"].fieldValue);
				break;
				}
				
				subSLA =  lfEntity[x]["SLA"].fieldValue;
				if (subSLA > "2") foundAE.setDaysDue(parseInt(subSLA));

				if (lfEntity[x]["DED Approval"].fieldValue == "CHECKED") {
					assignDept = "";
					taskAssign = false;
					}
				else {
					assignDept = lfEntity[x]["Approving Entity"].fieldValue;
					taskAssign = true;
					}
				var systemUserObj = aa.person.getUser(currentUserID).getOutput();
					if (!taskAssign) {
						logDebug("Assigning to current User");
						foundAE.setAssignedUser(systemUserObj);								
					} 
					var taskItem = foundAE.getTaskItem();
					var adjustResult = aa.workflow.assignTask(taskItem);
                    if (adjustResult.getSuccess())
							logDebug("SUCCESS");
                    else
                            logDebug("Error updating wfTask : " + adjustResult.getErrorMessage());
			}
		}
	}	
		/** End Legal Form **/
			
		/** Start Activities **/
		for (x in myActivities) {

				logDebug("Checking entities in activity " + myActivities[x]["Name"].fieldValue)
				currentCA = myActivities[x];
				actID = currentCA["Activity ID"].fieldValue;
				actCap = aa.cap.getCapID(actID).getOutput();
				actEntity = loadASITable("APPROVING ENTITIES",actCap);
				needInspect = getAppSpecific("Inspection Needed",actCap);
				if (needInspect == "Before") preInspectionRequired = true;
				if (needInspect == "Both") bothInspectionRequired = true;
				for (t in tTypeArray) {
					tType = tTypeArray[t];
					for (act in actEntity) {
						if (actEntity[act]["Transaction Type"].fieldValue.equals(tType) && 
							actEntity[act]["Suspended"].fieldValue != "CHECKED" && 
							(!actEntity[act]["Main Area"].fieldValue || actEntity[act]["Main Area"].fieldValue == capCity || actEntity[act]["Main Area"].fieldValue =="")) {
							if(tType.equals("Activity Replacement") && myActivities[x]["Existing"])
							{
								continue;
							}
							
							//push aeArray
							aeArray.push(actEntity[act]["Approving Entity"].fieldValue);
							logDebug("AE Found for Activity: " + actEntity[act]["Approving Entity"].fieldValue);
							
							//Grab Task
							var foundAE = "";
							for (var i in wfObj) {
								fTask = wfObj[i];					
								if (fTask.getTaskDescription().trim().toUpperCase().equals(actEntity[act]["Approving Entity"].fieldValue.trim().toUpperCase())) {
								foundAE = fTask;
								} 
							}
							if (!foundAE) {
							logDebug(actID + " Task does not Exist: " + actEntity[act]["Approving Entity"].fieldValue);
							break;
							}
							
							subSLA = actEntity[act]["SLA"].fieldValue;
							if (subSLA > "2") foundAE.setDaysDue(parseInt(subSLA));
							
							if (actEntity[act]["DED Approval"].fieldValue == "CHECKED") {
								assignDept = "";
								taskAssign = false;
								}
							else {
								assignDept = actEntity[act]["Approving Entity"].fieldValue;
								taskAssign = true;
								}								
	
							var systemUserObj = aa.person.getUser(currentUserID).getOutput();
								if (!taskAssign) {
								logDebug("Assigning to current User");
								foundAE.setAssignedUser(systemUserObj);								
								} 
								var taskItem = foundAE.getTaskItem();
								var adjustResult = aa.workflow.assignTask(taskItem);
                                if (adjustResult.getSuccess())
										logDebug("SUCCESS");
                                else
                                        logDebug("Error updating wfTask : " + adjustResult.getErrorMessage());
		
						}
					}
				}
		}					
		/** End Activities **/	
			
		/** Handle Inspections **/
		if (isNew && !preInspectionRequired && !bothInspectionRequired) {
			deleteTask(capId,"Pre-Inspection"); 
			activateTask("Approving Entity Fee Payment"); 
			assignTask("Approving Entity Fee Payment", currentUserID);
			}
		if (isNew && preInspectionRequired && !bothInspectionRequired) {
			deleteTask(capId,"Inspection");
			}
		/** End Inspections **/
		
		/** Remove AEs **/
		for (i in wfObj) {
			var fTask = wfObj[i];
			if (fTask.getProcessCode().equals("APPROVING ENTITIES")) {
				taskExists = false;
				for (e in aeArray) {
						aeName = aeArray[e];
						if (fTask.getTaskDescription().trim().toUpperCase().equals(aeName.trim().toUpperCase())) {
							taskExists = true;
					}		
				}
				if (!taskExists) deleteTask(capId,fTask.getTaskDescription())
				
				if (taskExists)
				{
					try
					{    
						// create a SRActivity record for data filter of license list
						// use data filter ('Activity Assign to Dept' field) to prevent AE query any license that does not belong to it 
						createSRActivity4ApproveEntityLicenseSearch(fTask);
					}
					catch(e)
					{ 
						aa.print("**ERROR: Expression occurs while executing createSRActivity4ApproveEntityLicenseSearch: " + e); 
					}
				}
			}			
		}
		logDebug("There are " + aeArray.length + " Approvals");
		if (aeArray.length == 0) deleteTaskAndSub(capId, "Approving Entities");
		
		/** End Remove **/			
}
function copyContacts(pFromCapId, pToCapId) {
    //Copies all contacts from pFromCapId to pToCapId
    //07SSP-00037/SP5017
    //
    if (pToCapId == null)
        var vToCapId = capId;
    else
        var vToCapId = pToCapId;

    var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
    var copied = 0;
    if (capContactResult.getSuccess()) {
        var Contacts = capContactResult.getOutput();
        for (yy in Contacts) {
            var newContact = Contacts[yy].getCapContactModel();
            newContact.setCapID(vToCapId);
            aa.people.createCapContactWithAttribute(newContact);
            copied++;
            logDebug("Copied contact from " + pFromCapId.getCustomID() + " to " + vToCapId.getCustomID());
        }
    }
    else {
        logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
        return false;
    }
    return copied;
}
function calculateAeFees(actCap)
{
/** get Cap's City ***/
	var capCity = null;
	var addrResult = aa.address.getAddressByCapId(capId); 
	if(addrResult) 
		var addrArray = addrResult.getOutput(); 
	if (addrArray) 
		for (var thisAddr in addrArray) 
			capCity = addrArray[thisAddr].getCity();
					
	//aa.print(capCity);
	if (capCity) 
	{
	
	capCity = capCity.trim();
	//set up the capCity to be English only.
	if (capCity.indexOf('أبوظبي') > -1 || capCity.indexOf('Abu Dhabi') > -1 )
		capCity = 'Abu Dhabi';
	else if (capCity.indexOf('العين') > -1 || capCity.indexOf('Al Ain') > -1 )
		capCity = 'Al Ain';
	else if (capCity.indexOf('المنطقة الغربية') > -1 || capCity.indexOf('Western Area') > -1 )
		capCity = 'Western Area';
	logDebug("This Cap has cap City: " + capCity);
	}
/** end of get Cap's City ***/	
var pVal = null;
var ruleMet = false;
qty = 1;
invoiced = false;
licenseAmend = "Licenses/License/Amendment/NA"
licenseRenew =  "Licenses/License/Renewal/NA"
licenseCanel = "Licenses/License/Cancellation/NA"
licenseIssue = "Licenses/License/Issue/New" 
isNotInfoType = true;

if(appTypeString == "Licenses/InfoDesk/License/NA")
{
	isNotInfoType = false;
	transType = getAppSpecific("Transaction Type");
	if(transType == "New License")
		appTypeString = "Licenses/License/Issue/New";
	else if(transType == "Renew License")
		appTypeString = "Licenses/License/Renewal/NA";
	else if(transType == "Amend License")
		appTypeString = "Licenses/License/Amendment/NA";
	else if(transType == "Cancel License")
		appTypeString = "Licenses/License/Cancellation/NA";
	
}
var paidPoliceFeeInCN = isPaidPoliceFeeInCN();
fees = loadASITable("AE FEES", actCap);
	for (x in fees)
	{
		invoiced = false;
		skip = false;
                                                //**Skip if the transaction started before AE GO-Live**//
		//goDate = aa.bizDomain.getBizDomainByValue("AEGoLiveDates",fees[x]["Approving Entity"].fieldValue).getOutput().getBizDomain().getDescription();
		//logDebug("FileDate is " + fileDate);
		//logDebug("GoLive date is " + goDate);
		//if (new Date(fileDate) < new Date(goDate)) 
		//continue;
		//skip fees marked DED Approval
		if (fees[x]["DED Approval"].fieldValue.equals("CHECKED")) continue; 
		if(fees[x]["Main Area"].fieldValue && !fees[x]["Main Area"].fieldValue.equals("") && !fees[x]["Main Area"].fieldValue.equals(capCity)) 
		{
			logDebug("Fees main area (" + fees[x]["Main Area"].fieldValue + ") and address main area" + capCity + " dont match");
			continue;
		}
		//If already paid police fee in license issuing, then ignore the police fee in activity amendment.
		if(fees[x]["Transaction Type"].fieldValue.equals("Activity Replacement") && fees[x]["Approving Entity"].fieldValue.equals("General Directorate of Abu Dhabi Police") && paidPoliceFeeInCN)
		{
			logDebug("The AE Fees for General Directorate of Abu Dhabi Police had already been paid in license issue");
			continue;
		}
		if (typeof(tType) != "string")
		{
			tType = "";
		}
		logDebug("Transaction Type is " + tType);
		//skip according to transaction type
		if(fees[x]["Transaction Type"].fieldValue.equals("License Issue") && !appTypeString.equals(licenseIssue)) continue;
		if(fees[x]["Transaction Type"].fieldValue.equals("Trade License Cancellation") && !appTypeString.equals(licenseCanel)) continue;
		if(fees[x]["Transaction Type"].fieldValue.equals("Trade License Renewal") && !appTypeString.equals(licenseRenew)) continue;
if(fees[x]["Transaction Type"].fieldValue.equals("Activity Replacement") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("Activity Replacement").toUpperCase().equals("YES") || tType != "Activity Replacement")) continue;
		if(fees[x]["Transaction Type"].fieldValue.equals("Sponsor Amendment") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("Sponsor Amendment").toUpperCase().equals("YES") || tType != "Sponsor Amendment")) continue;		
		if(fees[x]["Transaction Type"].fieldValue.equals("Trade Name Amendment") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("Trade Name Amendment").toUpperCase().equals("YES") || tType != "Trade Name Amendment")) {aa.print("continuing trade name amend");continue;}
		if(fees[x]["Transaction Type"].fieldValue.equals("Partners Amendment") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("Partners Amendment").toUpperCase().equals("YES") || tType != "Partners Amendment")) continue;	
		if(fees[x]["Transaction Type"].fieldValue.equals("Capital Amendment") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("Capital Amendment").toUpperCase().equals("YES") || tType != "Capital Amendment")) continue;	
		if(fees[x]["Transaction Type"].fieldValue.equals("Legal Form Amendment") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("Legal Form Amendment").toUpperCase().equals("YES") || tType != "Legal Form Amendment")) continue;
		if(fees[x]["Transaction Type"].fieldValue.equals("Location Amendment") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("Location Amendment").toUpperCase().equals("YES") || tType != "Location Amendment")) continue;
		if(fees[x]["Transaction Type"].fieldValue.equals("License Infr. Amendment") && (!appTypeString.equals(licenseAmend) || !getAppSpecific("License Infr. Amendment").toUpperCase().equals("YES") || tType != "License Infr. Amendment")) continue;
		if(fees[x]["Main Area"].fieldValue && !fees[x]["Main Area"].fieldValue.equals("") && !fees[x]["Main Area"].fieldValue.equals(capCity)) continue;
		//Filter for new Trade name AE Fees functionality
		if("Branch".equals(actCap.getCustomID()) && typeof(tnCap) == "object" && fees[x]["Branch Type"] && !appMatch("*/*/*/"+ fees[x]["Branch Type"].fieldValue, tnCap)) continue;
		
		//At this point we should be on the right transaction fee.
		
		//Apply regulation if any
		if (fees[x]["Regulated"].fieldValue.equals("CHECKED"))
		{
			if (fees[x]["Parameter"].fieldValue.toUpperCase().equals("$$ACTIVITIES$$"))
			{
				//Get all activities on license. See how many activities have the current approving entity. That is ur pVal.
				pVal = getNumberOfActivitiesWithThisAE(fees[x]["Approving Entity"].fieldValue);				
			}
			else
			{
				pVal = getAppSpecific(fees[x]["Parameter"].fieldValue + "");
			}				
			if (!pVal){
			logDebug("Parameter not found when calculating fees for approving entities " + fees[x]["Parameter"].fieldValue);
			continue;
			}
			
			if(fees[x]["Operator"].fieldValue.equals("="))
			{
				if(pVal.equals(fees[x]["Value 1"].fieldValue))
				{
					ruleMet =true;
				}
			}
			else if(fees[x]["Operator"].fieldValue.equals("!="))
			{
				if(!pVal.equals(fees[x]["Value 1"].fieldValue))
				{
					ruleMet =true;
				}
			}
			else if(fees[x]["Operator"].fieldValue.equals("<"))
			{
				if(parseFloat(pVal) < parseFloat(fees[x]["Value 1"].fieldValue))
				{
					ruleMet =true;
				}
			}
			else if(fees[x]["Operator"].fieldValue.equals(">"))
			{
				if(parseFloat(pVal) > parseFloat(fees[x]["Value 1"].fieldValue))
				{
					ruleMet =true;
				}
			}
			else if(fees[x]["Operator"].fieldValue.equals("BETWEEN"))
			{
				if(parseFloat(pVal) >= parseFloat(fees[x]["Value 1"].fieldValue) && parseFloat(pVal) <= parseFloat(fees[x]["Value 2"].fieldValue))
				{
					ruleMet =true;
				}
			}			
			//if the rule is not met then skip
			if (!ruleMet) 
			{
				logDebug("AE Fee was regulated but rules not met, skipping.")
				logDebug("Parameter: #" + fees[x]["Parameter"].fieldValue + "# Operator: #" + fees[x]["Operator"].fieldValue + "# Value 1: #" + fees[x]["Value 1"].fieldValue + "# Value 2: #" + fees[x]["Value 2"].fieldValue + "# ASI Value: #" + pVal + "#")
				continue; 
			}
		}
	amt = fees[x]["Fee Amount"].fieldValue;
	
	if (fees[x]["Period"].fieldValue && !fees[x]["Period"].fieldValue.equals("") && isNotInfoType && !appTypeString.equals(licenseIssue))
	{
		pcapId = getLicenseCapId(licenseIssue)
		exp = aa.expiration.getLicensesByCapID(pcapId)
		today = new Date();
		
   		if (exp.getSuccess())
   			{
				exp = exp.getOutput();
				expDate = new Date(exp.getExpDate().getMonth() + "/" + exp.getExpDate().getDayOfMonth() + "/" + exp.getExpDate().getYear());
				
				if (expDate > today)
				{
					logDebug("Parent License expiration date is " + expDate);
					logDebug("License not expired, not adding late fees.");
					continue;
				}
				else if (expDate < today)
				{
					
					if (fees[x]["Period"].fieldValue.equals("Daily"))
					{
						qty = (Math.ceil((today-expDate)/(1000 * 60 * 60 * 24)));
						amt = amt * qty;
					}
					else if (fees[x]["Period"].fieldValue.equals("Monthly"))
					{
						qty = (Math.ceil((today-expDate)/(1000 * 60 * 60 * 24 * 31)));
						amt = amt * qty;
					}
					else if (fees[x]["Period"].fieldValue.equals("Yearly"))
					{
						qty = (Math.ceil((today-expDate)/(1000 * 60 * 60 * 24 * 31 * 12)));
						amt = amt * qty;						
					}		
					else
					{
						logDebug("INFO: When assessing approving entity's fees, Period is not null but is not Daily, Monthly or Yearly.")
					}
				}
			}
		else
			{ 
				logDebug("**ERROR: Getting B1Expiration Object for Cap.  Reason is: " + exp.getErrorType() + ":" + exp.getErrorMessage()) ; 
				continue;
			}		

	}
	else
	{
		logDebug("Period not selected. This is not a late fees")
	}


	var newFeeResult = null;
	if (fees[x]["Payment Capture"].fieldValue.equals("Pre"))
	{
		newFeeResult = handlePreFee(fees[x]);
	}
	else
	{
		newFeeResult = handlePostFee(fees[x]);
	}
	logDebug("Returning new fee");
	if (newFeeResult && newFeeResult.getSuccess()) 
	{
		handleNewFee(newFeeResult, fees[x]);
	}
	else
	{
		logDebug("Failed to add AE Fee ")
	}
	}
}

function handlePreFee(currentFee)
{
	var newFeeResult = null;
	if (currentFee["Payment Capture"].fieldValue.equals("Pre"))
	{
		getFeeResult = aa.finance.getFeeItemByFeeCode(capId,"AE FEE PRE","FINAL");
		if (getFeeResult.getSuccess())
		{
			var feeList = getFeeResult.getOutput();
			for (feeNum in feeList)
			{
				feeEntityTitle = feeList[feeNum].getFeeDescription();

				if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
					logDebug("Invoiced fee AE FEE PRE found.  Not updating this fee. Not assessing new fee ");
					invoiced = true;;
				}
				else if (currentFee["Max Activity"].fieldValue.equals("CHECKED") && currentFee["Fee Description"].fieldValue.equals(feeEntityTitle)   && amt >= feeList[feeNum].getFee())
				{
				
					logDebug("Fee item removed because of its already there: " + feeList[feeNum].getFeeDescription());
				
					aa.finance.removeFeeItem(feeList[feeNum].getF4FeeItem());
				}
				else if (currentFee["Max Activity"].fieldValue.equals("CHECKED") && currentFee["Fee Description"].fieldValue.equals(feeEntityTitle)   && amt <= feeList[feeNum].getFee())
				{						
					logDebug("Skipping because max fee reached: " + feeList[feeNum].getFeeDescription());
					skip = true;
				}
			}
		}
		else
		{ 
			logDebug( "**ERROR: getting fee items (AE FEE PRE): " + getFeeResult.getErrorMessage())
		}		
		if(!invoiced && !skip)
		{
			newFeeResult = aa.finance.createFeeItem(capId, "AE FEES", "AE FEE PRE", "FINAL", qty);	
		}
	}
	return newFeeResult;
}

function handlePostFee(currentFee)
{
	var newFeeResult = null;
	if (!currentFee["Payment Capture"].fieldValue.equals("Pre"))
	{
		getFeeResult = aa.finance.getFeeItemByFeeCode(capId,"AE FEE POST","FINAL");
		if (getFeeResult.getSuccess())
		{
			var feeList = getFeeResult.getOutput();
			for (feeNum in feeList)
			{
				feeEntityTitle = feeList[feeNum].getFeeDescription();

				logDebug(currentFee["Fee Description"].fieldValue + " AND " + feeEntityTitle + " AND " + currentFee["Max Activity"].fieldValue + " AND " + amt + " AND " + feeList[feeNum].getFee());
				
				if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
					logDebug("Invoiced fee AE FEE POST found.  Not updating this fee. Not assessing new fee ");
					invoiced = true;
				}
				else if (currentFee["Max Activity"].fieldValue.equals("CHECKED") && currentFee["Fee Description"].fieldValue.equals(feeEntityTitle) &&  amt >= feeList[feeNum].getFee())
				{
					logDebug("Fee item removed because of its already there: " + feeList[feeNum].getFeeDescription());
					aa.finance.removeFeeItem(feeList[feeNum].getF4FeeItem());
				}
				else if (currentFee["Max Activity"].fieldValue.equals("CHECKED") && currentFee["Fee Description"].fieldValue.equals(feeEntityTitle)   && amt <= feeList[feeNum].getFee())
				{						
					logDebug("Skipping because max fee reached: " + feeList[feeNum].getFeeDescription());
					skip = true;
				}
				else if (!currentFee["Max Activity"].fieldValue.equals("CHECKED") && currentFee["Fee Description"].fieldValue.equals(feeEntityTitle))
				{
					logDebug("Max activity not selected. Adding fees.")
					aa.finance.removeFeeItem(feeList[feeNum].getF4FeeItem());					
					amt = parseInt(amt) + parseInt(feeList[feeNum].getF4FeeItem().getFee());
				}
			}					
		}
		else
		{ 
			logDebug( "**ERROR: getting fee items AE FEE POST " + getFeeResult.getErrorMessage())
		}	
		if(!invoiced && !skip)
		{
			newFeeResult = aa.finance.createFeeItem(capId, "AE FEES", "AE FEE POST", "FINAL", qty);
		}
	}
	return newFeeResult;
}

function handleNewFee(newFeeResult, originalFee)
{
	var feeSeq = newFeeResult.getOutput();
	var newFee = aa.finance.getFeeItemByPK(capId, feeSeq).getOutput().getF4FeeItem();


	newFee.setFeeDescription(originalFee["Fee Description"].fieldValue);
	newFee.setAccCodeL1(originalFee["Account Code"].fieldValue);
	newFee.setAccCodeL3(originalFee["eDirham Code"].fieldValue);
	newFee.setFeeNotes(originalFee["Approving Entity"].fieldValue)
	newFee.setSubGroup(originalFee["Type"].fieldValue);
	newFee.setFee(amt);

	editFee = aa.finance.editFeeItem(newFee);
	if(!editFee.getSuccess())
	{
		logDebug("Failed to update AE FEE for capId " + capId.getCustomID() + " " + editFee.getErrorMessage());
	}
	else
	{
		logDebug("Added Fee for approving entity: " + originalFee["Approving Entity"].fieldValue + " Amount: " + amt + " Qty: " + qty);
	}	
	
}

function changeInvoicedFee(capid, feeSeq, feeAmount)
{
    //1. Get fee item.
	var f4FeeItemScriptModel = aa.finance.getFeeItemByPK(capid, feeSeq).getOutput();
	if(f4FeeItemScriptModel.getFeeitemStatus().equals("INVOICED"))
	{
		//2. Update fee item, table is F4FEEITEM.
		var originalFeeAmount = f4FeeItemScriptModel.getFee();
		var feeAmountChange = feeAmount - originalFeeAmount;
		f4FeeItemScriptModel.setFee(feeAmount);
		aa.finance.editFeeItem(f4FeeItemScriptModel.getF4FeeItem());
		
		var invoiceList = aa.finance.getInvoiceByCapID(capid, aa.util.newQueryFormat()).getOutput(); 
		var X4FeeItemInvoiceScriptModel = aa.finance.getValidFeeItemInvoiceByFeeNbr(capid, feeSeq).getOutput();
		for(x in invoiceList)
		{
			//3. Get corresponding invoice number.
			if(invoiceList[x].getInvNbr() == X4FeeItemInvoiceScriptModel.getInvoiceNbr())
			{
				//4. Update F4INVOICE
				aa.finance.editInvoiceBalanceDue(invoiceList[x].getInvNbr(), invoiceList[x].getInvoiceModel().getInvAmount() + feeAmountChange, invoiceList[x].getInvoiceModel().getBalanceDue() + feeAmountChange);
				
				//5. Update X4FEEITEM_INVOICE.
				X4FeeItemInvoiceScriptModel.getX4FeeItemInvoice().setFee(feeAmount);
				aa.finance.editFeeItemInvoice(X4FeeItemInvoiceScriptModel.getX4FeeItemInvoice());
				
				//6. Update BPERMIT_DETAIL.
				var capDetailScriptModel = aa.cap.getCapDetail(capid).getOutput();
				capDetailScriptModel.getCapDetailModel().setTotalFee(capDetailScriptModel.getCapDetailModel().getTotalFee() + feeAmountChange);
				capDetailScriptModel.getCapDetailModel().setBalance(capDetailScriptModel.getCapDetailModel().getBalance() + feeAmountChange);
				aa.cap.editCapDetail(capDetailScriptModel.getCapDetailModel());
				
				//7. Update ACCOUNTING_AUDIT_TRAIL
				//N/A
				
				aa.print("Change fee amount successfully");
			}
		}	
	}
}
	
function comparePeopleAbuDhabi(peop)
	{

	// this function will be passed as a parameter to the createRefContactsFromCapContactsAndLink function.
	//
	// takes a single peopleModel as a parameter, and will return the sequence number of the first G6Contact result
	//
	// returns null if there are no matches
	//
	// current search method is by email only.  In order to use attributes enhancement 09ACC-05048 must be implemented
	//

	peop.setAuditDate(null)
	peop.setAuditID(null)
	peop.setAuditStatus(null)
	peop.setBirthDate(null)
	// peop.setBusName2(null)
	// peop.setBusinessName(null)
	peop.setComment(null)
	peop.setCompactAddress(null)
	peop.setContactSeqNumber(null)
	//peop.setContactType(null)
	peop.setContactTypeFlag(null)
	peop.setCountry(null)
	peop.setCountryCode(null)
	peop.setEmail(null)   
	peop.setEndBirthDate(null)
	peop.setFax(null)
	peop.setFaxCountryCode(null)
	// peop.setFein(null)
	// peop.setFirstName(null)
	peop.setFlag(null)
	peop.setFullName(null)
	peop.setGender(null)
	peop.setHoldCode(null)
	peop.setHoldDescription(null)
	peop.setId(null)
	peop.setIvrPinNumber(null)
	peop.setIvrUserNumber(null)
	// peop.setLastName(null)
	peop.setMaskedSsn(null)
	// peop.setMiddleName(null)
	peop.setNamesuffix(null)
	peop.setPhone1(null)
	peop.setPhone1CountryCode(null)
	peop.setPhone2(null)
	peop.setPhone2CountryCode(null)
	peop.setPhone3(null)
	peop.setPhone3CountryCode(null)
	peop.setPostOfficeBox(null)
	peop.setPreferredChannel(null)
	peop.setPreferredChannelString(null)
	peop.setRate1(null)
	peop.setRelation(null)
	peop.setSalutation(null)
	//peop.setServiceProviderCode(null)
	peop.setSocialSecurityNumber(null)
	peop.setTitle(null)
	// peop.setTradeName(null)
	

	// Remove all attributes except the birthdate
		
	var a = peop.getAttributes();

	if (a)
		{
		//
		// Clear unwanted attributes
		var ai = a.iterator();
		while (ai.hasNext())
			{
			var xx = ai.next();
			if (!xx.getAttributeName().toUpperCase().equals("BIRTH DATE"))
				{
				aa.print("removing attribute : " + xx.getAttributeName());
				ai.remove();
				}
			}
		}

	var r = aa.people.getPeoplesByAttrs(peop, "", "N", null);

    if (!r.getSuccess())
			{ logDebug("WARNING: error searching for people : " + r.getErrorMessage()); return false; }

	var peopResult = r.getOutput();

	if (!peopResult || peopResult.length == 0)
		{
		logDebug("Searched for REF contact, no matches found, returing null");
		return null;
		}

	if (peopResult.length > 0)
		{
		logDebug("Searched for a REF Contact, " + peopResult.length + " matches found! returning the first match : " + peopResult[0].getContactSeqNumber() );
		return peopResult[0].getContactSeqNumber()
		}

}

function composeSearchData(param) {
    var searchDataModel = aa.specialSearch.newSearchDataModel().getOutput();
    searchDataModel.setEntityType(param.entityType);
    searchDataModel.setAuditID(currentUserID);
    if (param) {
        // englishTradeName,arabicTradeName,groupID
        if (param.capID != undefined) {
            searchDataModel.setServiceProviderCode(param.capID.getServiceProviderCode());
            searchDataModel.setCapID(param.capID);
        }
        if (param.entityID != undefined) {
            searchDataModel.setEntityID(param.entityID);
        }
        if (param.englishFieldValue != undefined) {
            searchDataModel.setSearchData1(param.englishFieldValue);
        }
        if (param.originalEnglishTradeName != undefined) {
            searchDataModel.setOriginData1(param.originalEnglishTradeName);
        }
        if (param.arabicFieldValue != undefined) {
            searchDataModel.setSearchData2(param.arabicFieldValue);
        }
        if (param.originalArabicTradeName != undefined) {
            searchDataModel.setOriginData2(param.originalArabicTradeName);
        }
        if (param.groupID != undefined) {
            searchDataModel.setSearchGroupID(param.groupID);
        }
    }
    return searchDataModel;
}

function containsTask(wfstr)
	{
	//returns if a task exists in a workflow, regardless of active or not
	foundTask = false;
	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()))
				foundTask = true;
		}
		return foundTask;
	}
	
function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}
	
function copyAEFees(sourceCapId, targetCapId, activityID, period) {

    forceInvoice = false;  //follow the fee invoice flag
    forceInvoiceYes = false;

    if (arguments.length > 4) // optional parameter to force invoicing on or off
    {
        forceInvoice = true;
        forceInvoiceYes = arguments[4];
    }

    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    var feeA = loadFees(sourceCapId)

    for (x in feeA) {
        thisFee = feeA[x];

        if (thisFee.accCodeL1 == null) {

        feeQuantity = (period * thisFee.unit)

        addFeeWithExtraData(thisFee.code, thisFee.sched, thisFee.period, feeQuantity, "N", targetCapId, activityID, null, activityID)

        }

    }

}

function copyASIFieldsAndData(srcCapId, targetCapId) // optional groups to ignore
	{
	var ignoreArray = new Array();
	for (var i=2; i<arguments.length;i++)
		ignoreArray.push(arguments[i])

	var  appSpecificInfo = null;
	var s_result = aa.appSpecificInfo.getByCapID(srcCapId);
	if(s_result.getSuccess())
		{
		var appSpecificInfo = s_result.getOutput();
		if (appSpecificInfo == null || appSpecificInfo.length == 0)
			{
			logDebug("WARNING: no appSpecificInfo on this CAP:" + srcCapId);
			return null;
			}
		}
	else
		{
		logDebug("**WARNING: Failed to get appSpecificInfo: " + s_result.getErrorMessage());
		return null;
		}

	for (var loopk in appSpecificInfo)
			  if (!exists(appSpecificInfo[loopk].getCheckboxType(),ignoreArray))
			       {
					var sourceAppSpecificInfoModel = appSpecificInfo[loopk];
					sourceAppSpecificInfoModel.setPermitID1(targetCapId.getID1());
					sourceAppSpecificInfoModel.setPermitID2(targetCapId.getID2());
					sourceAppSpecificInfoModel.setPermitID3(targetCapId.getID3());
					//3. Edit ASI on target CAP (Copy info from source to target)
					aa.appSpecificInfo.editAppSpecInfoValue(sourceAppSpecificInfoModel);
				}
	}
	
function copyASITableFieldsAndData(srcCapId, targetCapId)
	{
	var tableNameArray = null;
	var result = aa.appSpecificTableScript.getAppSpecificGroupTableNames(capId);
	if(result.getSuccess())
		{
		tableNameArray = result.getOutput();
		}
	else
		{
		logDebug("WARNING: no ASI Tables on this CAP:" + srcCapId);
		return null;
		}

	for (var loopk in tableNameArray)
		{
		var tableName = tableNameArray[loopk];
		var appSpecificTable = null;

		//1. Get appSpecificTableModel with source CAPID
		var s_result = aa.appSpecificTableScript.getAppSpecificTableModel(srcCapId,tableName);
		if(s_result.getSuccess())
			{
			var appSpecificTable = s_result.getOutput();
			if (appSpecificTable == null || appSpecificTable.length == 0)
				{
				logDebug("WARNING: null table on this CAP:" + capId);
				continue;
				}
			}
		else
			{
			logDebug("WARNING: Failed to appSpecificTable: " + s_result.getErrorMessage());
			continue;
			}


		//2. Edit AppSpecificTableInfos with target CAPID

	    var aSTableModel = appSpecificTable.getAppSpecificTableModel();

		aa.appSpecificTableScript.editAppSpecificTableInfos(aSTableModel,targetCapId,null);
		}
	}
function copyConditions(fromCapId)
	{
	var getFromCondResult = aa.capCondition.getCapConditions(fromCapId);
	if (getFromCondResult.getSuccess())
		var condA = getFromCondResult.getOutput();
	else
		{ logDebug( "**ERROR: getting cap conditions: " + getFromCondResult.getErrorMessage()) ; return false}

	for (cc in condA)
		{
		var thisC = condA[cc];

		var addCapCondResult = aa.capCondition.addCapCondition(capId, thisC.getConditionType(), thisC.getConditionDescription(), thisC.getConditionComment(), thisC.getEffectDate(), thisC.getExpireDate(), sysDate, thisC.getRefNumber1(),thisC.getRefNumber2(), thisC.getImpactCode(), thisC.getIssuedByUser(), thisC.getStatusByUser(), thisC.getConditionStatus(), currentUserID, "A")
		if (addCapCondResult.getSuccess())
			logDebug("Successfully added condition (" +  thisC.getImpactCode() + ") " +  thisC.getConditionDescription());
		else
			logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}
	
function copyConditionsByStatus(fromCapId, condStatus) {
	
	/** get Cap's City ***/
	var capCity = null;
	var addrResult = aa.address.getAddressByCapId(capId); 
	if(addrResult) 
		var addrArray = addrResult.getOutput(); 
	if (addrArray) 
		for (var thisAddr in addrArray) 
			capCity = addrArray[thisAddr].getCity();
					
	//aa.print(capCity);
	if (capCity) 
	{
	
	capCity = capCity.trim();
	//set up the capCity to be English only.
	if (capCity.indexOf('أبوظبي') > -1 || capCity.indexOf('Abu Dhabi') > -1 )
		capCity = 'Abu Dhabi';
	else if (capCity.indexOf('العين') > -1 || capCity.indexOf('Al Ain') > -1 )
		capCity = 'Al Ain';
	else if (capCity.indexOf('المنطقة الغربية') > -1 || capCity.indexOf('Western Area') > -1 )
		capCity = 'Western Area';
	logDebug("This Cap has cap City: " + capCity);
	}
	//aa.print(capCity);
	
	
	
	
    var newCondStatus = "Unverified";
    var getFromCondResult = aa.capCondition.getCapConditions(fromCapId);
    if (getFromCondResult.getSuccess())
        var condA = getFromCondResult.getOutput();
    else
    { logDebug("**WARNING: getting cap conditions: " + getFromCondResult.getErrorMessage()); return false }

    for (cc in condA) {
        var thisC = condA[cc];
         if (thisC.getConditionStatus() == condStatus && thisC.getConditionType().indexOf("Fee") == -1) { // JHS 12/26/10 do not copy fees
		var oldNum = thisC.getConditionNumber();
		
		//Get Condition's Main Area from Condition Group
		condMainArea = null;
		condAreaArr = null;
		condAreaArr = thisC.getConditionGroup().split("--");
		//aa.print("condAreaArr = " + condAreaArr);
		//aa.print("condAreaArr = " + condAreaArr.length);
		if (condAreaArr.length > 1)	
		{
			condMainArea = condAreaArr[1].trim();
		}
		
		
		//Check if the condition has main area, then if city is available on cap, ignore itif there is no match
		if (condMainArea != null)
		{
			if(capCity == null)
			{
				logDebug("Condition has main Area and there is no cap city for the cap!! ");
				continue;
			}
			if(condMainArea != capCity)
			{
				logDebug("Condition has main Area which is not matching the cap city !! ");
				continue;
			}
		}
		else
		{
			logDebug("The condition main area is null");
		}
		//printMethods(thisC);
		var capCondArr = new Array();

		var arSourceCond = aa.condition.getCondition(thisC,"ar_AE").getOutput();
		var arCond = aa.capCondition.getNewConditionScriptModel().getOutput();
		
		arCond.setResLangId("ar_AE");
         	arCond.setConditionDescription(arSourceCond.getResConditionDescription());
         	arCond.setConditionComment(arSourceCond.getResConditionComment());
         	arCond.setLongDescripton(arSourceCond.getResLongDescripton());  
         	arCond.setResolutionAction(arSourceCond.getResResolutionAction());
         	arCond.setPublicDisplayMessage(arSourceCond.getResPublicDisplayMessage());

		var enSourceCond = aa.condition.getCondition(thisC,"en_US").getOutput();
		var enCond = aa.capCondition.getNewConditionScriptModel().getOutput();
		
		thisC.setResLangId("en_US");
		capCondArr.push(thisC);
		capCondArr.push(arCond);

		thisC.setCapID(capId);
		thisC.setConditionStatus("Unverified");

		var addCapCondResult = aa.condition.createConditionWithMulLangs(capCondArr,thisC);
		
        if (addCapCondResult.getSuccess())
        	{
               	logDebug("Successfully added condition " + addCapCondResult.getOutput() + " " + thisC.getConditionGroup() + " from condition " + oldNum);
     		}
               	else
            		logDebug("**WARNING: couldn't add a copy of condition (" + thisC.getConditionNumber() + "): " + addCapCondResult.getErrorMessage());
      		}
    	}
     }
	 
function copyFees(sourceCapId, targetCapId, activityID, period) {

    forceInvoice = false;  //follow the fee invoice flag
    forceInvoiceYes = false;

    if (arguments.length > 4) // optional parameter to force invoicing on or off
    {
        forceInvoice = true;
        forceInvoiceYes = arguments[4];
    }

    var feeSeqArray = new Array();
    var invoiceNbrArray = new Array();
    var feeAllocationArray = new Array();

    var feeA = loadFees(sourceCapId)

    for (x in feeA) {
        thisFee = feeA[x];

        if (thisFee.status != "INVOICED" && thisFee.status != "NEW") continue;

        //aa.print("We have a fee " + thisFee.code + " status : " + thisFee.status);
	feeQuantity = (period * thisFee.unit)

        if (forceInvoice && forceInvoiceYes) {
            addFeeWithExtraData(thisFee.code, thisFee.sched, thisFee.period, feeQuantity, "Y", targetCapId, activityID, null, activityID)

            //aa.print("We are invoicing the fee " + thisFee.code + " status : " + thisFee.status);
            var feeSeqArray = new Array();
            var paymentPeriodArray = new Array();

            feeSeqArray.push(thisFee.sequence);
            paymentPeriodArray.push(thisFee.period);
            var invoiceResult_L = aa.finance.createInvoice(sourceCapId, feeSeqArray, paymentPeriodArray);

            if (!invoiceResult_L.getSuccess()){
                //aa.print("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " + invoiceResult_L.getErrorMessage());
		}
        }
        else {
            addFeeWithExtraData(thisFee.code, thisFee.sched, thisFee.period, feeQuantity, "N", targetCapId, activityID, null, activityID)

        }

    }

}

function copyLicenseProfessional(srcCapId, targetCapId)
{
	//1. Get license professionals with source CAPID.
	var capLicenses = getLicenseProfessional(srcCapId);
	if (capLicenses == null || capLicenses.length == 0)
	{
		return;
	}
	//2. Get license professionals with target CAPID.
	var targetLicenses = getLicenseProfessional(targetCapId);
	//3. Check to see which licProf is matched in both source and target.
	for (loopk in capLicenses)
	{
		sourcelicProfModel = capLicenses[loopk];
		//3.1 Set target CAPID to source lic prof.
		sourcelicProfModel.setCapID(targetCapId);
		targetLicProfModel = null;
		//3.2 Check to see if sourceLicProf exist.
		if (targetLicenses != null && targetLicenses.length > 0)
		{
			for (loop2 in targetLicenses)
			{
				if (isMatchLicenseProfessional(sourcelicProfModel, targetLicenses[loop2]))
				{
					targetLicProfModel = targetLicenses[loop2];
					break;
				}
			}
		}
		//3.3 It is a matched licProf model.
		if (targetLicProfModel != null)
		{
			//3.3.1 Copy information from source to target.
			aa.licenseProfessional.copyLicenseProfessionalScriptModel(sourcelicProfModel, targetLicProfModel);
			//3.3.2 Edit licProf with source licProf information.
			aa.licenseProfessional.editLicensedProfessional(targetLicProfModel);
		}
		//3.4 It is new licProf model.
		else
		{
			//3.4.1 Create new license professional.
			aa.licenseProfessional.createLicensedProfessional(sourcelicProfModel);
		}
	}
}


function copyWorkflow(sourceCapId,targetCapId,processName,targetTaskName,newTaskName,newTaskArabicName,taskPosition)
{

	if (processName == null || processName == "")
		{	logDebug("WARNING: processName is null") ; return false; }

	//
	// Get the target Task
	//
	var workflowResult = aa.workflow.getTasks(targetCapId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	var workflowResult2 = aa.workflow.getTasks(targetCapId);
 	if (workflowResult2.getSuccess())
  	 	var wfObj2 = workflowResult2.getOutput();
  	else
  	  	{ logDebug("**ERROR: Failed to get workflow object2: " + s_capResult.getErrorMessage()); return false; }


	var tTask = null;

	for (i in wfObj)
		{
   		fTask = wfObj[i];

   	  	if (fTask.getTaskDescription().toUpperCase().equals(newTaskName.toUpperCase()))
		  	{
			logDebug("New Task Name : " + newTaskName + " already exists, cancelling workflow copy");
			return false;
			}

  		if (fTask.getTaskDescription().toUpperCase().equals(targetTaskName.toUpperCase()))
  			{
			tTask = wfObj[i];
			nTask = wfObj2[i];
			}

		}

	if (!tTask)
  	  	{ logDebug("**ERROR: Task not found: " + targetTaskName); return false; }


	//
	// Copy the destination task
	//
	nTask.setTaskDescription(newTaskName);
	nTask.setResLangID("ar_AE");
	nTask.setResTaskDescription(newTaskArabicName);

	logDebug("Copying task " + tTask.getTaskDescription() + " to " + nTask.getTaskDescription());

	result = aa.workflow.insertTaskWithResourceData(nTask,taskPosition)
	//result = aa.workflow.copyTask(nTask, tTask, "P")
	if (!result.getSuccess())
		{ logDebug("error " + result.getErrorMessage()); return false; }


	//
	// Add the subworkflow
	//

	logDebug("Attaching subprocess " + processName + " to " + nTask.getTaskDescription());

	var result = aa.workflow.insertSubProcess(nTask,processName,true)
	if (!result.getSuccess())
		{ logDebug("error " + result.getErrorMessage()); return false; }

}

function createExemptPayment(cashier,paymentComment) {  // cashier is string of user ID.  optional capID
  
	var itemCap = capId;
	var paymentNumber;
	var result;
	var receiptResult;
	var p;
	var bureauCode;
	var personModel;
	
  	if (arguments.length > 2) itemCap = arguments[2]; // use cap ID specified in args

	p = aa.finance.createPaymentScriptModel();
	p.setAuditDate(aa.date.getCurrentDate());
	p.setAuditStatus("A");
	p.setCapID(itemCap);
	p.setCashierID(cashier);
	p.setPaymentAmount(0)
	p.setPaymentChange(0);
	p.setPaymentComment(paymentComment);
	p.setPaymentDate(aa.date.getCurrentDate());
	p.setPaymentMethod("Cash");
	p.setPaymentStatus("Paid")

	result = aa.finance.makePayment(p);
	
	if (result.getSuccess())  { 
	  paymentNumber = result.getOutput();
	  }
	else {
	  logDebug("**WARNING: Could not make payment : " + result.getErrorMessage()) ; return false; 
	    }

	if (paymentNumber) {
		receiptResult = aa.finance.generateReceipt(itemCap,aa.date.getCurrentDate(),paymentNumber,cashier,null);

		if (!receiptResult.getSuccess()) {
			logDebug("**WARNING: Could not make receipt : " + receiptResult.getErrorMessage()) ; return false; 
			}
		}

	logDebug("Successfully made exempt payment " + paymentNumber);

	personModel = aa.person.getUser(cashier).getOutput(); 
	if (personModel) bureauCode = personModel.getBureauCode() ;  
	if (bureauCode) updateBrCodeOnPayments(bureauCode);
	
	}
	
function createLicenseSearchEntries(itemCapId) {
	
	var itemEntityType = 'TRADELICENSE';
    if (arguments.length > 1)
    	itemEntityType = arguments[1]; // use entityType specified in arguments
	
    var scriptResult = aa.licenseProfessional.getLicensedProfessionalsByCapID(itemCapId);
    if (scriptResult.success) {
        var licenseList = scriptResult.getOutput();
        if (licenseList == null) return;
        //aa.print(licenseList);
        var searchDataList = [];
        var index = 0;
        for (var i = 0; i < licenseList.length; ++i) {
            var license = licenseList[i];
            if (license.businessName == null && license.busName2 == null) {
                continue;
            }

			searchDataList[index] = composeSearchData({
				capID: itemCapId,
				entityID: license.getLicenseNbr(),
				englishFieldValue: aa.specialSearch.getPureEnglishText(license.getBusinessName()).getOutput(),
				originalEnglishTradeName: license.getBusinessName(),
				arabicFieldValue: aa.specialSearch.getPureArabicText(license.getBusName2()).getOutput(),
				originalArabicTradeName: license.getBusName2(),
				groupID: index,
				entityType: itemEntityType
			});

            index++;
        }
        aa.specialSearch.removeSearchDataByCapID(itemCapId);
        aa.specialSearch.createBatchSearchData(searchDataList);
    }
}

function createRefContact(capAltId, contactType, englishName, arabicName)
{
    var people = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.PeopleModel").getOutput();
    people.setServiceProviderCode(aa.getServiceProviderCode());
    people.setFein(capAltId);
    people.setContactType(contactType);
    people.setBusinessName(arabicName);
    people.setTradeName(englishName);
    people.setAuditStatus("A")

    aa.people.createPeople(people);

    var resObj = aa.people.getPeopleByBusinessName(arabicName);
    var retPeopleArray = resObj.getOutput();
    var retPeople = retPeopleArray[0];

    var peopAttrResult = aa.people.getPeopleAttributeByPeople(retPeople.getContactSeqNumber(), contactType);

    if (!peopAttrResult.getSuccess())
    {
       //aa.print("**WARNING retrieving attributes: " + peopAttrResult.getErrorMessage());
       return;
    }

    var peopAttrArray = peopAttrResult.getOutput();

    for (i in peopAttrArray)
    {
       peopAttr = peopAttrArray[i].getPeopleAttributeModel();

   	if(peopAttr.getAttributeName().equals("100% LOCAL"))
   		{
     		peopAttr.setAttributeValue("Y");
			var peopAttrRes = aa.people.editPeopleAttribute(peopAttr);
   		}
	if(peopAttr.getAttributeName().equals("NATIONALITY"))
   		{
     		peopAttr.setAttributeValue("UNITED ARAB EMIRATES");
			var peopAttrRes = aa.people.editPeopleAttribute(peopAttr);
   		}
	}

}

function createReferenceLP(rlpId,rlpType,pContactType,bizname1,bizname2)
	{
	// Custom for Abu Dhabi -- uses Trade Name application to populate reference LP
	var updating = false;

	//
	// get Contacts from the source CAP
	//
	var capContResult = aa.people.getCapContactByCapID(capId);
	if (capContResult.getSuccess())
		{ conArr = capContResult.getOutput();  }
	else
		{
		logDebug ("**ERROR: getting cap contact: " + capAddResult.getErrorMessage());
		return false;
		}

	if (!conArr.length)
		{
		logDebug ("**WARNING: No contact available");
		return false;
		}


	//
	// get Address from the source CAP
	//

	var useAddress = null;
	var capAddressResult = aa.address.getAddressByCapId(capId);
	if (capAddressResult.getSuccess())
		{
		var addressArr = capAddressResult.getOutput();
		for (var yy in addressArr)
			useAddress = addressArr[yy];  // get the last record, should only be one for AD
		}


	//
	// check to see if the licnese already exists...if not, create.
	//

	var newLic = getRefLicenseProf(rlpId)

	if (newLic)
		{
		updating = true;
		logDebug("Updating existing Ref Lic Prof : " + rlpId);
		}
	else
		var newLic = aa.licenseScript.createLicenseScriptModel();

	//
	//   get contact record
	//

	if (pContactType==null)
		var cont = conArr[0]; //if no contact type specified, use first contact
	else
		{
		var contFound = false;
		for (yy in conArr)
			{
			if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType()))
				{
				cont = conArr[yy];
				contFound = true;
				break;
				}
			}
		if (!contFound)
			{
			logDebug ("**WARNING: No Contact found of type: "+pContactType);
			return false;
			}
		}

	peop = cont.getPeople();
	addr = peop.getCompactAddress();


	//
	// now populate the fields
	//

	//newLic.setContactFirstName(cont.getFirstName());
	//newLic.setContactMiddleName(cont.getMiddleName());  //method not available
	//newLic.setContactLastName(cont.getLastName());
	newLic.setBusinessName(bizname1);
	newLic.setBusinessName2(bizname2);  // available only on 6.6.1i patch i

	if (useAddress)  // custom mappings per DB 07/16/2009
		{
		//aa.print("using address " + useAddress)
		newLic.setAddress1(useAddress.getAddressLine1());
		newLic.setAddress2(useAddress.getAddressLine2());
		newLic.setAddress3(useAddress.getStreetName());
		newLic.setCity(useAddress.getCity());
		newLic.setState(useAddress.getInspectionDistrict());
		//newLic.setZip(useAddress.getZip());

		if (useAddress.getInspectionDistrict())
			newLic.setLicState(useAddress.getInspectionDistrict());
		else
			newLic.setLicState("AD");


		}
	else
		{
		newLic.setAddress1(addr.getAddressLine1());
		newLic.setAddress2(addr.getAddressLine2());
		newLic.setAddress3(addr.getAddressLine3());
		newLic.setCity(addr.getCity());
		newLic.setState(addr.getState());
		newLic.setZip(addr.getZip());

		if (addr.getState())
			newLic.setLicState(addr.getState());
		else
			newLic.setLicState("AD");
		}

	if("WorkflowTaskUpdateAfter".equals(controlString))
	{
		var issuedDate = aa.date.parseDate(wfDate);
		newLic.setLicenseIssueDate(issuedDate);
	}
        

	newLic.setPhone1(peop.getPhone1());
	newLic.setPhone1CountryCode(peop.getPhone1CountryCode());
	newLic.setPhone2(peop.getPhone2());
	newLic.setPhone2CountryCode(peop.getPhone2CountryCode());
	newLic.setEMailAddress(peop.getEmail());
	newLic.setFax(peop.getFax());

	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");

	newLic.setLicenseType(rlpType);


	newLic.setStateLicense(rlpId);

	if (updating)
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	else
		myResult = aa.licenseScript.createRefLicenseProf(newLic);


	if (!myResult.getSuccess())
		{
		logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return null;
		}

	logDebug("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType + " Sequence Number " + myResult.getOutput());

	lpsmResult = aa.licenseScript.getRefLicenseProfBySeqNbr(servProvCode,myResult.getOutput())
	if (!lpsmResult.getSuccess())
		{ logDebug("**WARNING error retrieving the LP just created " + lpsmResult.getErrorMessage()) ; return null}

	lpsm = lpsmResult.getOutput();

	// Now add the LP to the CAP
	asCapResult= aa.licenseScript.associateLpWithCap(capId,lpsm)
	if (!asCapResult.getSuccess())
		{ logDebug("**WARNING error associating CAP to LP: " + asCapResult.getErrorMessage()) }
	else
		{ logDebug("Associated the CAP to the new LP") }


	// Now make the LP primary due to bug 09ACC-06791
	var capLps = getLicenseProfessional(capId);
	for (var thisCapLpNum in capLps)
		{
		if("ApplicationSubmitAfterStart".equals(controlString))
		{
			logDebug("looking at license : " + capLps[thisCapLpNum].getLicenseNbr());
			if (capLps[thisCapLpNum].getLicenseNbr().equals(rlpId))
				{
				var thisCapLp = capLps[thisCapLpNum];
				thisCapLp.setPrintFlag("Y");
				aa.licenseProfessional.editLicensedProfessional(thisCapLp);
				logDebug("Updated primary flag on Cap LP : " + rlpId);
				}
		}
		else
		{
			logDebug("looking at license : " + capLps[thisCapLpNum].getStateLicense());
			if (capLps[thisCapLpNum].getStateLicense().equals(rlpId))
				{
				var thisCapLp = capLps[thisCapLpNum];
				thisCapLp.setPrintFlag("Y");
				aa.licenseProfessional.editLicensedProfessional(thisCapLp);
				logDebug("Updated primary flag on Cap LP : " + rlpId);
				}		
		}
		}


	// Find the public user by contact email address and attach
	puResult = aa.publicUser.getPublicUserByEmail(peop.getEmail())
	if (!puResult.getSuccess())
		{ logDebug("**WARNING finding public user via email address " + peop.getEmail() + " error: " + puResult.getErrorMessage()) }
	else
		{
		pu = puResult.getOutput();
		asResult = aa.licenseScript.associateLpWithPublicUser(pu,lpsm)
		if (!asResult.getSuccess())
			{logDebug("**WARNING error associating LP with Public User : " + asResult.getErrorMessage());}
		else
			{logDebug("Associated LP with public user " + peop.getEmail()) }
		}

	return lpsm;
	}
	
//AE Console - license search (SUP-2013-00383)
//fTask: com.accela.aa.emse.dom.TaskItemScriptModel 
function createSRActivity4ApproveEntityLicenseSearch(fTask)
{
	var servProvCode = fTask.getTaskItem().getServiceProviderCode();
	var capID = fTask.getCapID();
	var actName = "WF-" + fTask.getProcessID() + "-" + fTask.getStepNumber();
	var assignDept = fTask.getAssignedStaff().getDeptOfUser();
	
	var SRActivities = getSRActivities(servProvCode, capID, actName, assignDept);
	if (SRActivities != null && SRActivities.size() > 0)
	{
		// already exist, don't need to create a duplicate one
		return;
	}
	
    var activity = aa.proxyInvoker.newInstance("com.accela.aa.aamain.servicerequest.ActivityModel").getOutput();
    activity.setServiceProviderCode(servProvCode);
    activity.setCapID(capID);
    activity.setActivityName(actName);
	//activity.setActivityType(activityType);
	activity.setActivityDescription(fTask.getTaskDescription());
    activity.setAssignedDeptNumber(assignDept);
	//activity.setAssignedStaffID(fTask.getAssignedStaff().getUserID());
	activity.setActDate(fTask.getTaskItem().getAuditDate());
	activity.setAuditID(fTask.getTaskItem().getAuditID());
	activity.setInternalOnly("Y");

	var activityBiz = aa.proxyInvoker.newInstance("com.accela.aa.aamain.servicerequest.ActivityBusiness").getOutput(); 
	activityBiz.createActivity(activity);	
}

function createSearchData(itemCapId, englishTradeName, arabicTradeName) {
    var itemCap = aa.cap.getCap(itemCapId).getOutput();
    var capType = itemCap.getCapType();
    var filterName = aa.cap.getCapTypeFilterName(capType).getOutput();
    var altID = itemCapId.getCustomID();


    var scriptResult = aa.specialSearch.isTradeNameExist(englishTradeName, arabicTradeName);
    if (!scriptResult.getSuccess()) {
        logDebug("**ERROR: when execute isTradeNameExist");
        return "-1";
    }

    if (!String(scriptResult.getOutput()) == 'false') {
        logDebug("**ERROR: Trade Name already exists");
        return false;
    }

    var removeResult = aa.specialSearch.removeSearchDataByCapID(capId);
    if (!removeResult.getSuccess()) {
        logDebug("**ERROR: Failed to remove generic search data : " + removeResult.getErrorMessage());
        return false;
    }

    var searchDataModel = aa.specialSearch.newSearchDataModel().getOutput();
    searchDataModel.setEntityType(filterName);
    searchDataModel.setSearchGroupID(0);
    searchDataModel.setEntityID(altID.toUpperCase());
    searchDataModel.setAuditID(currentUserID);
    searchDataModel.setCapID(itemCapId);
    searchDataModel.setServiceProviderCode(itemCapId.getServiceProviderCode());

    searchDataModel.setOriginData1(englishTradeName);
    searchDataModel.setOriginData2(arabicTradeName);
    englishTradeName = aa.specialSearch.getPureEnglishText(englishTradeName).getOutput();
    arabicTradeName = aa.specialSearch.getPureArabicText(arabicTradeName).getOutput();
    searchDataModel.setSearchData1(englishTradeName);
    searchDataModel.setSearchData2(arabicTradeName);



    var createResult = aa.specialSearch.createSearchData(searchDataModel);
    if (!createResult.getSuccess()) {
        logDebug("**ERROR: Failed to created generic search data : " + createResult.getErrorMessage());
        return false;
    }

    return true;

}

function createTNSearchEntries(itemCapId, asiArray) {
    var englishTNList = new Array("English Prefered Name", "English Alternate 1", "English Alternate 2", "English Alternate 3", "English Alternate 4", "English Alternate 5", "English Alternate 6", "English Alternate 7", "English Alternate 8", "English Alternate 9", "English Alternate 10")
    var arabicTNList = new Array("Arabic Prefered Name", "Arabic Alternate 1", "Arabic Alternate 2", "Arabic Alternate 3", "Arabic Alternate 4", "Arabic Alternate 5", "Arabic Alternate 6", "Arabic Alternate 7", "Arabic Alternate 8", "Arabic Alternate 9", "Arabic Alternate 10")

    var altID = itemCapId.getCustomID();

    var searchObjs = [];

    for (var i in englishTNList) {
        thisEng = englishTNList[i]
        thisAra = arabicTNList[i]

        if (asiArray[thisEng] || asiArray[thisAra]) {
            var searchDataModel = composeSearchData({
                englishFieldValue: aa.specialSearch.getPureEnglishText(asiArray[thisEng]).getOutput(),
                arabicFieldValue: aa.specialSearch.getPureArabicText(asiArray[thisAra]).getOutput(),
                groupID: parseInt(i),
                originalEnglishTradeName: asiArray[thisEng],
                originalArabicTradeName: asiArray[thisAra],
                entityID: altID,
                capID: itemCapId,
                entityType: 'TRADENAME'
            });

            searchObjs.push(searchDataModel);
        }
    }

    aa.specialSearch.recreateBatchSearchData(itemCapId, searchObjs);
}

function dateAdd(td,amt)
	// perform date arithmetic on a string
	// td can be "mm/dd/yyyy" (or any string that will convert to JS date)
	// amt can be positive or negative (5, -3) days
	// if optional parameter #3 is present, use working days only
	{

	var useWorking = false;
	if (arguments.length == 3)
		useWorking = true;

	if (!td)
		dDate = new Date();
	else
		dDate = new Date(td);
	var i = 0;
	if (useWorking)
		if (!aa.calendar.getNextWorkDay)
			{
			logDebug("getNextWorkDay function is only available in Accela Automation 6.3.2 or higher.");
			while (i < Math.abs(amt))
				{
				dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * (amt > 0 ? 1 : -1)));
				if (dDate.getDay() > 0 && dDate.getDay() < 6)
					i++
				}
			}
		else
			{
			while (i < Math.abs(amt))
				{
				dDate = new Date(aa.calendar.getNextWorkDay(aa.date.parseDate(dDate.getMonth()+1 + "/" + dDate.getDate() + "/" + dDate.getFullYear())).getOutput().getTime());
				i++;
				}
			}
	else
		dDate.setTime(dDate.getTime() + (1000 * 60 * 60 * 24 * amt));

	return (dDate.getMonth()+1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();
	}
	
function dateAddMonths(pDate, pMonths)
	{
	// Adds specified # of months (pMonths) to pDate and returns new date as string in format MM/DD/YYYY
	// If pDate is null, uses current date
	// pMonths can be positive (to add) or negative (to subtract) integer
	// If pDate is on the last day of the month, the new date will also be end of month.
	// If pDate is not the last day of the month, the new date will have the same day of month, unless such a day doesn't exist in the month, in which case the new date will be on the last day of the month
	//
	if (!pDate)
		baseDate = new Date();
	else
		baseDate = new Date(pDate);

	var day = baseDate.getDate();
	baseDate.setMonth(baseDate.getMonth() + pMonths);
	if (baseDate.getDate() < day)
		{
		baseDate.setDate(1);
		baseDate.setDate(baseDate.getDate() - 1);
		}
	return ((baseDate.getMonth() + 1) + "/" + baseDate.getDate() + "/" + baseDate.getFullYear());
	}
	
function deleteTaskAndSub(targetCapId,deleteTaskName)
{
	//
	// Get the target Task
	//
	var workflowResult = aa.workflow.getTasks(targetCapId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	var tTask = null;

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if (fTask.getTaskDescription().toUpperCase().equals(deleteTaskName.toUpperCase()))
  			{
			var tTask = wfObj[i];
			}

		}

	if (!tTask)
  	  	{ logDebug("**WARNING: Task not found: " + deleteTaskName); return false; }


	logDebug("Removing task " + tTask.getTaskDescription());
        aa.workflow.removeSubProcess(tTask);
	var result = aa.workflow.removeTask(tTask)

	if (!result.getSuccess())
		{ logDebug("error " + result.getErrorMessage()); return false; }

}
function deleteTaskContains(parentTask,taskContains)
{
	//
	// Get the target Task
	//
	var wfObj = getChildTasks(parentTask);

	var tTask = null;

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if (fTask.getTaskDescription().toUpperCase().indexOf(taskContains.toUpperCase()) != -1)
  			{
			var tTask = wfObj[i];
                        var result = aa.workflow.removeTask(tTask)
			}

		}

}


function doCustomNotifications(notStdChoice,notType)
	{

	var tmpNots = aa.bizDomain.getBizDomain(notStdChoice).getOutput().toArray()
	for (tmpNot in tmpNots)
	   {
	   bd = tmpNots[tmpNot]
	   crit = bd.getBizdomainValue().split("\\|")

	   if (crit.length == 5)
	         {
	         noteTypeCri	= String(crit[0]);
	         appTypeCri 	= String(crit[1]);
	         processCri 	= String(crit[2]);
	         taskCri 		= String(crit[3]);
	         taskStatCri	= String(crit[4]);

	         if (!noteTypeCri.equals(notType)) continue;

	         if (!appMatch(appTypeCri)) continue;

	         if (taskCri.toUpperCase() != wfTask.toUpperCase() && taskCri != "*") continue;

	         if (taskStatCri.toUpperCase() != wfStatus.toUpperCase() && taskStatCri != "*") continue;

	         // custom *Activity* logic for AD looks for a process code that starts with "1" to determine if it is an activity workflow

	         if ((processCri.toUpperCase() == "*ACTIVITY*" && wfProcess.substr(0,1) == "1") || processCri == "*" || processCri.toUpperCase() == wfProcess.toUpperCase())
	         	{
	         	sendMessage("email.workflow.genericSubject",bd.getDescription());
				}
	        }
	  	}
 	}


function editAppSpecTable(tableName, colName, rowNumber, newValue)
{
	//Description:
	//ASIT in Accela is made up of 2 ArrayLists, one for columns and one for cells with
	//no connection between the 2 arrays to know which value in the cell array corresponds 
	//to which column and row.
	//The solution will figure out the position of the cell to be edited using the following formula
	//[(rowNumber -1) * (number of columns in table)] + index of colName
	//If rowNumber == "ALL", then all values for the specified column will be changed.
	//Optional capId.
	
	//set itemCap to current capId unless it is being passed as a parameter.
	var itemCap = capId;
	if (arguments.length > 4)
	{
		itemCap = arguments[4];
	}
	//**
	
	//Get the specific table object.
	var tsm = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName);
	//**
	
	//Check to make sure the API call was successful, if not, return false;
	if (!tsm.getSuccess())
	{ 
		logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tsm.getErrorMessage()) ; 
		return false; 
	}
	//**

	//Perform some validation on input data
	if(colName == null || colName == "")
	{
		logDebug("**WARNING: Error the column name to edit cannot be empty or null");
		return false;
	}
	if(rowNumber == null || rowNumber == "" || rowNumber < 1)
	{
		logDebug("**WARNING: Error the row number has to be greater than 0");
		return false;
	}
	//**
	
	//Get column arrayList, field arrayList
	var tsm = tsm.getOutput();
	var tsm = tsm.getAppSpecificTableModel();
	var fld = tsm.getTableField();
	var col = tsm.getColumns();
	//**
	
	//Get column index and return false if the column name does not exist
	var colIndex = -1;
	var index = 0;
	i = col.iterator();
	while (i.hasNext())
	{
		objCol = i.next();
		if(objCol.getColumnName().toUpperCase() == colName.toUpperCase())
		{
			colIndex = index;
			break;
		}
		index ++;
	}
	if (colIndex < 0)
	{
		logDebug("**WARNING: error the specified column name (" + col.get(2).getColumnName() + ")does not exist");
		return false;
	}
	//**
	
	//Change all the values of the specified columns if rowNumber == "ALL"
	var cell = colIndex;
	rowNumber = rowNumber.toString();
	if(rowNumber.toUpperCase() == "ALL")
	{
		//Get the number of rows by dividing the length of field array (cells) 
		//by number of columns and taking the ceiling.
		totalRows = Math.ceil(fld.size()/col.size());
		//**
				
		for (x =0; x < totalRows; x++)
		{			
			fld.set(cell, newValue);
			cell += col.size();
		}
	}
	
	//Change only specific cell
	else
	{
		//The specified cell is equal to the colIndex + [(row number - 1) * number of columns
		cell = (rowNumber - 1) * col.size();
		cell += colIndex;		
		fld.set(cell, newValue);
		//**
	}
	//**
	
	//Finally set the table back after editing
	tsm.setTableField(fld);
	editResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
	if (!editResult .getSuccess())
	{ 
		logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + editResult.getErrorMessage()); 
		return false;
	}
	else
	{
		logDebug("Successfully edited record(s) in ASI Table: " + tableName);
	}
	//**
}

function editCompletedDate(vDate)
{
	var vCapId = capId
	if (arguments.length > 1)
		vCapId = arguments[1];

	var cdo = aa.cap.getCapDetail(vCapId);
	if (cdo.getSuccess())
	{
		var cd = cdo.getOutput();
		cd.setCompleteDate( aa.date.parseDate(vDate) );
		aa.cap.editCapDetail(cd.getCapDetailModel());
		logDebug("Completed date set to: " + vDate);
	}
	else
		logDebug("Could not set completed date");
}


function feeAmountActivityCode(feeCapId, feeCode, licPeriod)
	{
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(feeCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		//only grab fees that have a certain account code, have a number fee item code, and are less than 6000
		if (feeObjArr[ff].getFeeCod() == feeCode)
		{
			if (feeObjArr[ff].getFee()/licPeriod < "6001")
			{
			feeTotal+=(feeObjArr[ff].getFee()/licPeriod)
		    }
		    else 
		    {
		    feeTotal = 6000
		    }
		}

	return feeTotal;
	}
	
function feeAmountAllActivity(feeCapId, feeAccCode, licPeriod)
	{
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(feeCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		//only grab fees that have a certain account code, have a number fee item code, and are less than 6000
		if (feeObjArr[ff].getAccCodeL1() == feeAccCode && feeObjArr[ff].getFeeCod() == 'ACTIVITY' && (feeObjArr[ff].getFee()/licPeriod) < "6001")
		{
		feeTotal+=feeObjArr[ff].getFee()
		}


	return feeTotal;
	}
function feeAmountAllExemptActivity(feeCapId, feeAccCode, licPeriod)
	{
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(feeCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		//only grab fees that have a certain account code, have a number fee item code, and are greater than 6000
		if (feeObjArr[ff].getAccCodeL1() == feeAccCode && feeObjArr[ff].getFeeCod() == 'ACTIVITY' && (feeObjArr[ff].getFee()/licPeriod) > "6000")
		{
		feeTotal+=feeObjArr[ff].getFee()
		}


	return feeTotal;
	}
	
function generateDiscount(feeCapId)
	{
	noDiscount = aa.bizDomain.getBizDomain("No Discount").getOutput();  
	if (noDiscount) noDiscount = noDiscount.toArray();  
	
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(feeCapId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		//only grab fees that belong to DED and ignore certain fees
		if (feeObjArr[ff].getAccCodeL1()) {
			if (feeObjArr[ff].getAccCodeL1().indexOf("323") > -1)
			{
				ignoreDiscount = false
				for (d in noDiscount) {
					if (noDiscount[d].getBizdomainValue().equals(feeObjArr[ff].getFeeDescription())) ignoreDiscount = true; 
				}
				if (!ignoreDiscount) {
						feeTotal+=(feeObjArr[ff].getFee() * .1);
						logDebug(feeTotal);
					}
			}
		}
		feeTotal = (feeTotal * -1);

	return feeTotal;
	}
	
function getB1AttributeValue(attrList,attName)
	{

	var itr = attrList.iterator();
	while (itr.hasNext())
		{
		var a = itr.next();

		if (String(a.getB1AttributeName()).toUpperCase().equals(String(attName).toUpperCase()))
			return a.getB1AttributeValue();
		}
	}
	
function getIdenticalAddressArray(itemCap,ats,statusArray)
	{
	// itemCap:   capId to check.  Will check all address on the record.
	// capArray:  array of capScriptModels.   will compare itemCap addresses to all addresses on each Cap
	//
	// returns:  array of capIds that match.

	var gisobj = new Array();

	var resultArray = new Array();

	var checkAttrArray = new Array();

	if (arguments.length > 3) //Check for task names to exclude
		{
		for (var i=3; i<arguments.length; i++)
			checkAttrArray.push(arguments[i]);
		}

	var r = aa.address.getAddressWithAttributeByCapId(capId);

	if (!r.getSuccess())
		{ logDebug("WARNING retrieving addresses for capId : " + r.getErrorMessage()); return false; }

	var addrs = r.getOutput()

	for (var checkAddrNum in addrs)
		{
		var checkAddr = addrs[checkAddrNum];

		capArray = aa.cap.getCapListByCollection(null, checkAddr, null, null, null, null, gisobj).getOutput()

		for (var thisCap in capArray)
			{
                        logDebug(capArray[thisCap].getCapID().getCustomID() + " and status " + capArray[thisCap].getCapStatus());
			// disqualify the current CAP

			if (capArray[thisCap].getCapID().getCustomID().equals(itemCap.getCustomID())) // don't return this CAP
				continue;

			// disqualify based on the CAP status
			if (!exists(capArray[thisCap].getCapStatus(),statusArray))
				continue;

			// disqualify based on CAP Type

			var matchArray = capArray[thisCap].getCapType().toString().split("/");

			var isMatch = true;
			var ata = ats.split("/");

			if (ata.length != 4)
				logDebug("**ERROR in appMatch.  The following Application Type String is incorrectly formatted: " + ats);
			else
				for (xx in ata)
					if (!ata[xx].equals(matchArray[xx]) && !ata[xx].equals("*"))
						isMatch = false;

			if (!isMatch) continue;

			// disqualify based on other address fields

			var r = aa.address.getAddressWithAttributeByCapId(capArray[thisCap].getCapID());

			if (!r.getSuccess())
				{ logDebug("WARNING retrieving addresses for capId : " + capArray[thisCap].getCapID() + "  " + r.getErrorMessage()); return false; }

			var targetAddrs = r.getOutput()

			for (targetAddrNum in targetAddrs)
				{
				var targetAddr = targetAddrs[targetAddrNum];

				// custom for Abu Dhabi, check owner name which is stored in the county

				var owner1 = String(aa.specialSearch.getPureArabicText(checkAddr.getCounty()).getOutput())
				var owner2 = String(aa.specialSearch.getPureArabicText(targetAddr.getCounty()).getOutput())

				if (!owner1.equals(owner2))
					continue;

				// now loop through attributes to check

				var attrMatch = true;

				for (var thisAttrCheck in checkAttrArray)
					{
					var checkAttVal = getB1AttributeValue(checkAddr.getAttributes(),checkAttrArray[thisAttrCheck]);
					var targetAttVal = getB1AttributeValue(targetAddr.getAttributes(),checkAttrArray[thisAttrCheck]);
					if (checkAttVal && targetAttVal & !checkAttVal.equals(targetAttVal))
						attrMatch = false;
					}

				if (!attrMatch) continue;

				logDebug("found one " + capArray[thisCap].getCapID().getCustomID());

				resultArray.push(capArray[thisCap].getCapID());

				}
			}
		}

	if (!resultArray.length) return false;

	return resultArray;
	}

function getLegalFormCap(moduleName, trxType, legalFormType, appStatus)
	{
	logDebug("looking for a " + moduleName + " Cap for legal form: " + legalFormType + "  Transaction Type: " + trxType + "   App Status: " + appStatus);
	var getCapResult = aa.cap.getCapIDsByAppSpecificInfoField("Legal Form Template",legalFormType);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by legal form: " + getCapResult.getErrorMessage()) ; return null }

	for (aps in apsArray)
		{
		myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();

		if (myCap.getCapType().getGroup() == moduleName)
			{
			if (myCap.getCapStatus() == appStatus)
				{
				var xTrxType = "" + getAppSpecific("Application Type",apsArray[aps].getCapID());
				if (xTrxType == trxType)
					{
					logDebug("templateCap found for legal form: " + legalFormType + "  Transaction Type: " + trxType + "   App Status: " + appStatus + "   Cap ID: " + apsArray[aps].getCapID().toString());
					return apsArray[aps];
					}
				}
			}

		}
	}
	
function getLicense(tradeNameID,licCapType,licCapStatus)
	{
	// returns the capId of a valid trade license
	var licCapArray = getChildren(licCapType, tradeNameID)

	if (licCapArray == null || licCapArray.length == 0)
		{
		return;
		}

	for (var aps in licCapArray)
		{

		myCap = aa.cap.getCap(licCapArray[aps]).getOutput();
		//aa.print(myCap.getCapStatus());
		if (myCap.getCapStatus() == licCapStatus)
			{
			//aa.print("License CAP found: Cap Type: " + licCapType + " App Status: " + licCapStatus + "   Cap ID: " + licCapArray[aps].getCustomID().toString());
			return licCapArray[aps];
			}
		}
	}
	
function getLicenseCapId(licenseCapType)
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var capLicenses = getLicenseProfessional(itemCap);
	if (capLicenses == null || capLicenses.length == 0)
		{
		return null;
		}

	for (var capLic in capLicenses)
		{
		var LPNumber = capLicenses[capLic].getLicenseNbr()
		var lpCapResult = aa.cap.getCapID(LPNumber);
		if (!lpCapResult.getSuccess())
			{ logDebug("**ERROR: No cap ID associated with License Number : " + LPNumber) ; continue; }
		licCapId = lpCapResult.getOutput();
		if (appMatch(licenseCapType,licCapId))
			return licCapId;
		}
	}
function getNode(fString, fName) {
    var fValue = "";
    var startTag = "<" + fName + ">";
    var endTag = "</" + fName + ">";
    startPos = fString.indexOf(startTag) + startTag.length;
    endPos = fString.indexOf(endTag);
    if (startPos > 0 && startPos < endPos) fValue = fString.substring(startPos, endPos);
    return unescape(fValue);
}

function getNumberOfActivitiesWithThisAE(aeName)
{
	//optional capId
		if (arguments.length > 1)
		{
			capId = arguments[1];
		}
		logDebug("getNumberOfActivitiesWithThisAE start with parameter: " + aeName);
		
/** get Cap's City ***/
	logDebug("Getting CapCity");
	var capCity = null;
	var addrResult = aa.address.getAddressByCapId(capId); 
	if(addrResult) 
		var addrArray = addrResult.getOutput(); 
	if (addrArray) 
		for (var thisAddr in addrArray) 
			capCity = addrArray[thisAddr].getCity();
					
	//aa.print(capCity);
	if (capCity) 
	{
	
	capCity = capCity.trim();
	//set up the capCity to be English only.
	if (capCity.indexOf('أبوظبي') > -1 || capCity.indexOf('Abu Dhabi') > -1 )
		capCity = 'Abu Dhabi';
	else if (capCity.indexOf('العين') > -1 || capCity.indexOf('Al Ain') > -1 )
		capCity = 'Al Ain';
	else if (capCity.indexOf('المنطقة الغربية') > -1 || capCity.indexOf('Western Area') > -1 )
		capCity = 'Western Area';
	logDebug("This Cap has cap City: " + capCity);
	}
/** end of get Cap's City ***/
		
		
		myActivities = loadASITable("COMMERCIAL ACTIVITIES");
		result = 0;
		
		/** Determine Transaction Type **/
		tTypeArray = new Array();
		if (appTypeString.equals("Licenses/License/Amendment/NA")) {
			isAmend = true;
			pcapId = getParent(); 
			pActivities = loadASITable("COMMERCIAL ACTIVITIES", pcapId);
			for (curr in myActivities)
			{
				for (old in pActivities)
				{
					if(pActivities[old]["Activity ID"].fieldValue.equals(myActivities[curr]["Activity ID"].fieldValue))
					{
						myActivities[curr]["Existing"] = true;
					}
				}
			}
		}
		if (appTypeString.equals("Licenses/License/Amendment/NA")) {
			isAmend = true;
			
			if (getAppSpecific("Activity Replacement").substr(0,1) == "Y") tTypeArray.push("Activity Replacement");
			if (getAppSpecific("Capital Amendment").substr(0,1) == "Y") tTypeArray.push("Capital Amendment");
			if (getAppSpecific("Legal Form Amendment").substr(0,1) == "Y") tTypeArray.push("Legal Form Amendment");
			if (getAppSpecific("Signboard Amendment").substr(0,1) == "Y") tTypeArray.push("Signboard Amendment");
			if (getAppSpecific("Location Amendment").substr(0,1) == "Y") tTypeArray.push("Location Amendment");
			if (getAppSpecific("Partners Amendment").substr(0,1) == "Y") tTypeArray.push("Partners Amendment");
			if (getAppSpecific("Sponsor Amendment").substr(0,1) == "Y") tTypeArray.push("Sponsor Amendment");
			if (getAppSpecific("Trade Name Amendment").substr(0,1) == "Y") tTypeArray.push("Trade Name Amendment");
			if (getAppSpecific("Country Amendment (Foreign Company)").substr(0,1) == "Y") tTypeArray.push("Country Amendment (Foreign Company)");
			if (getAppSpecific("License Type Amendment").substr(0,1) == "Y") tTypeArray.push("License Type Amendment");
			if (getAppSpecific("Manager Amendment").substr(0,1) == "Y") tTypeArray.push("Manager Amendment");
			if (getAppSpecific("Heirs Amendment").substr(0,1) == "Y") tTypeArray.push("Heirs Amendment");
			if (getAppSpecific("Partners Nationality Amendment").substr(0,1) == "Y") tTypeArray.push("Partners Nationality Amendment");
			if (getAppSpecific("Partners Shares Amendment").substr(0,1) == "Y") tTypeArray.push("Partners Shares Amendment");
			}
		if (appTypeString.equals("Licenses/License/Renewal/NA")) {
			isRenew = true;
			tTypeArray.push("Trade License Renewal");
			}
		if (appTypeString.equals("Licenses/License/Cancellation/NA")){
			isCancel = true;
			tTypeArray.push("Trade License Cancellation");
			}
		if (appTypeString.equals("Licenses/License/Issue/New")) {
			isNew = true;
			tTypeArray.push("License Issue");
			}
		/** End Transaction Type**/		
	/** End Cap Data **/
		logDebug("Finished determining app type");
			
		/** Start Activities **/
		for (aeAct in myActivities) {

				logDebug("Checking entities in activity " + myActivities[aeAct]["Name"].fieldValue)
				currentCA = myActivities[aeAct];
				actID = currentCA["Activity ID"].fieldValue;
				actCap = aa.cap.getCapID(actID).getOutput();
				actEntity = loadASITable("APPROVING ENTITIES",actCap);
				for (t in tTypeArray) {
					tType = tTypeArray[t];
					for (act in actEntity) {
						if (actEntity[act]["Transaction Type"].fieldValue.equals(tType) && 
							actEntity[act]["Suspended"].fieldValue != "CHECKED" && 
							(!actEntity[act]["Main Area"].fieldValue || actEntity[act]["Main Area"].fieldValue == capCity || actEntity[act]["Main Area"].fieldValue =="")) {
							if(tType.equals("Activity Replacement") && myActivities[aeAct]["Existing"])
							{
								continue;
							}
							
							if (actEntity[act]["Approving Entity"].fieldValue.toUpperCase().equals(aeName.toUpperCase()))
							{
								result += 1;
							}
							
							
					}
				}
		}					
		/** End Activities **/	
		}
logDebug("Returning " + result + "activities")		
return result + "";							
}	
function getRenewalCapByParentCapIDForIncomplete(parentCapid)
{
    if (parentCapid == null || aa.util.instanceOfString(parentCapid))
    {
    }
    var result = aa.cap.getProjectByMasterID(parentCapid, "Renewal", "Incomplete");
    if(result.getSuccess())
    {
      projectScriptModels = result.getOutput();
      if (projectScriptModels == null || projectScriptModels.length == 0)
      {
        aa.print("WARNING: Failed to get renewal CAP by parent CAPID(" + parentCapid + ") for review");
        return null;
      }
      projectScriptModel = projectScriptModels[0];
      return projectScriptModel;
    }  
    else 
    {
      logDebug("WARNING: Failed to get renewal CAP by parent CAP(" + parentCapid + ") for review: " + result.getErrorMessage());
      return null;
    }
}

function getRenewalCapByParentCapIDForReview(parentCapid)
{
    if (parentCapid == null || aa.util.instanceOfString(parentCapid))
    {
    }
    var result = aa.cap.getProjectByMasterID(parentCapid, "Renewal", "Review");
    if(result.getSuccess())
    {
      projectScriptModels = result.getOutput();
      if (projectScriptModels == null || projectScriptModels.length == 0)
      {
        aa.print("WARNING: Failed to get renewal CAP by parent CAPID(" + parentCapid + ") for review");
        return null;
      }
      projectScriptModel = projectScriptModels[0];
      return projectScriptModel;
    }  
    else 
    {
      logDebug("WARNING: Failed to get renewal CAP by parent CAP(" + parentCapid + ") for review: " + result.getErrorMessage());
      return null;
    }
}

function getSRActivities(servProvCode, capIDModel, actName, assignDept)
{
	aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), "newInstance ActivityModel");
    var activity = aa.proxyInvoker.newInstance("com.accela.aa.aamain.servicerequest.ActivityModel").getOutput();
    activity.setServiceProviderCode(servProvCode);
    activity.setCapID(capIDModel);
    activity.setActivityName(actName);
    activity.setAssignedDeptNumber(assignDept);

	aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), "newInstance ActivityBusiness");
	var activityBiz = aa.proxyInvoker.newInstance("com.accela.aa.aamain.servicerequest.ActivityBusiness").getOutput(); 
    return activityBiz.getActivityListByModel(activity);
}

function getTemplateCap(moduleName, trxType, activityId, appStatus)
	{
	logDebug("looking for a " + moduleName + " Cap for activity ID: " + activityId + "  Transaction Type: " + trxType + "   App Status: " + appStatus);
	var getCapResult = aa.cap.getCapIDsByAppSpecificInfoField("Activity ID",activityId);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()) ; return null }

	for (aps in apsArray)
		{
		myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();

		if (myCap.getCapType().getGroup() == moduleName)
			{
			if (myCap.getCapStatus() == appStatus)
				{
				var xTrxType = "" + getAppSpecific("Application Type",apsArray[aps].getCapID());
				if (xTrxType == trxType)
					{
					logDebug("templateCap found for activity: " + activityId + "  Transaction Type: " + trxType + "   App Status: " + appStatus + "   Cap ID: " + apsArray[aps].getCapID().toString());
					return apsArray[aps];
					}
				}
			}

		}
	}
	
function invoiceAllFeesExcept()
    {
    //invoices all assessed fees having fperiod, optional fee code(s) to exclude

	var invFeeSeqList = new Array();
	var invPaymentPeriodList = new Array();


	var skipArray = new Array();
	var invoiceAll = false;
	if (arguments.length > 0)
		{
		for (var i=0; i<arguments.length; i++)
			skipArray.push(arguments[i]);
		}
	else
		invoiceAll = true;


	var feeA = loadFees(capId)
        var deptName = getDepartmentName(currentUserID);
	for (var x in feeA)
		{
		thisFee = feeA[x];
		if (!invoiceAll && (exists(thisFee.accCodeL1,skipArray) || thisFee.code == "AE FEE POST")) continue;

		if ((thisFee.status.equals("NEW") && thisFee.amount*1 > 0) || thisFee.accCodeL1 == '10')
			{
			invFeeSeqList.push(thisFee.sequence);
			invPaymentPeriodList.push(thisFee.period);
            logDebug("Assessed fee "+thisFee.code+" found and tagged for invoicing");


            }
        }

	if (invFeeSeqList.length)
		{
		invoiceResult = aa.finance.createInvoice(capId, invFeeSeqList, invPaymentPeriodList);
		if (invoiceResult.getSuccess())
			{
			logDebug("Invoicing assessed fee items is successful.");
			balanceDue = aa.cap.getCapDetail(capId).getOutput().getBalance();
			logDebug("Updated balanceDue to " + balanceDue);
			}
		else
			logDebug("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
		}
    }
	
function invoiceFee(fcode, fperiod) {
    var feeFound = false;
    var invFeeSeqList = new Array();
    var invPaymentPeriodList = new Array();
    getFeeResult = aa.finance.getFeeItemByFeeCode(capId, fcode, fperiod);
    if (getFeeResult.getSuccess()) {
        var feeList = getFeeResult.getOutput();
        for (feeNum in feeList)
            if (feeList[feeNum].getFeeitemStatus().equals("NEW")) {
                var feeSeq = feeList[feeNum].getFeeSeqNbr();
                invFeeSeqList.push(feeSeq);
                invPaymentPeriodList.push(fperiod);
                feeFound = true;
                logDebug("Assessed fee " + fcode + " found and tagged for invoicing");
            }
        if (invFeeSeqList.length) {
            invoiceResult = aa.finance.createInvoice(capId, invFeeSeqList, invPaymentPeriodList);
            if (invoiceResult.getSuccess()) {
                logDebug("Invoicing assessed fee items is successful.");
                balanceDue = aa.cap.getCapDetail(capId).getOutput().getBalance();
                logDebug("Updated balanceDue to " + balanceDue);
            }
            else
			logDebug("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    } else {
        logDebug("**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())
    }
    return feeFound;
}

function isMatchLicenseProfessional(licProfScriptModel1, licProfScriptModel2)
{
	if (licProfScriptModel1 == null || licProfScriptModel2 == null)
	{
		return false;
	}
	if (licProfScriptModel1.getLicenseType().equals(licProfScriptModel2.getLicenseType())
		&& licProfScriptModel1.getLicenseNbr().equals(licProfScriptModel2.getLicenseNbr()))
	{
		return true;
	}
	return	false;
}


function isPaidPoliceFeeInCN()
{
	var paidPoliceFeeInCN = false;
	if(appTypeString.equals(licenseAmend) && getAppSpecific("Activity Replacement").toUpperCase().equals("YES") && isNotInfoType)
	{
		for (x in oActivities)
		{
		   pActivityId = oActivities[x]["Activity ID"].fieldValue;
		   if(pActivityId)
		   { 
				pActivityCap = aa.cap.getCapID(pActivityId).getOutput();
				pActivityAEFees = loadASITable("AE FEES", pActivityCap);
				{
					for (x in pActivityAEFees)
					{
						if("General Directorate of Abu Dhabi Police".equals(pActivityAEFees[x]["Approving Entity"].fieldValue)
							&& "Activity Replacement".equals(pActivityAEFees[x]["Transaction Type"].fieldValue))
						{
							paidPoliceFeeInCN = true;
							break;
						}	
					}
				}
				if(paidPoliceFeeInCN)
				{
					break;
				}
		   }
		}
	}
	return paidPoliceFeeInCN;
}

function loadSubProcesses(parentTask, taskNameEn, taskNameAr, taskOrder, taskSLA, taskAssign) {
//Requires Tasks in the Workflow called Generic1, Generic2, etc.

    var initialTaskStatus = "In Progress";
    
    var wfObj = getChildTasks(parentTask);

    var wfObj2 = getChildTasks(parentTask);
    var taskExists = false;
    var tTask = null;

    for (i in wfObj) {
        fTask = wfObj[i];

        if (fTask.getTaskDescription().toUpperCase().equals("GENERIC" + taskOrder)) {
            tTask = wfObj[i];
            nTask = wfObj2[i];
        }
        if (fTask.getTaskDescription().toUpperCase().equals(taskNameEn.toUpperCase())) {
            taskExists = true;
        }

    }

 if (!tTask)
    { logDebug("**WARNING: Task not found"); return false; }
 if (taskExists)
    { logDebug("**WARNING: Task already exists, skipping"); return false; }

    //
    // Copy the destination task
    //
    var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	
    if (taskAssign) {
	var dpt = aa.people.getDepartmentList(null).getOutput();
	for (var thisdpt in dpt)
	  	{
	  	var m = dpt[thisdpt];
	  	if (m.getDeptName() != null) {
                	if (m.getDeptName().toUpperCase().equals(taskAssign.toUpperCase())){
			systemUserObj.setAgencyCode(m.getAgencyCode());
			systemUserObj.setBureauCode(m.getBureauCode());
			systemUserObj.setDivisionCode(m.getDivisionCode());
			systemUserObj.setSectionCode(m.getSectionCode());
			systemUserObj.setGroupCode(m.getGroupCode());
			systemUserObj.setOfficeCode(m.getOfficeCode());
			}
                }
		}


    }
    arabicObj = aa.bizDomain.getBizDomainByValue("Authorities",taskNameAr,"ar_AE").getOutput();
    if (arabicObj) arabicValue = arabicObj.getDispBizdomainValue(); else arabicValue = taskNameEn;


    nTask.setTaskDescription(taskNameEn);
    nTask.setResLangID("ar_AE");
    nTask.setResTaskDescription(arabicValue);
    nTask.setDaysDue(parseInt(taskSLA));
    nTask.setAssignedUser(systemUserObj);
    nTask.setActiveFlag("N");

    result = aa.workflow.insertTaskWithResourceData(nTask, "P")
    if (result.getSuccess())
    { logDebug("sub task added:" + taskNameEn); }

    if (!result.getSuccess())
    { logDebug("sub task error " + result.getErrorMessage()); return false; }

    logDebug("all done");

}

function loadSupervisorReceipts(fromDateString, toDateString, branchString, groupString, tableName, trxType) {

    // need to add one day since getPaymentByDate will not work for a single day!
    toDateString = dateAdd(toDateString,1);

    fromJSDate = new Date(fromDateString); fromJSDate.setHours(0); fromJSDate.setMinutes(0); fromJSDate.setSeconds(0); fromJSDate.setMilliseconds(0)
    toJSDate = new Date(toDateString); toJSDate.setHours(23); toJSDate.setMinutes(59); toJSDate.setSeconds(59); toJSDate.setMilliseconds(999)

    firstDate = aa.date.transToJavaUtilDate(fromJSDate.getTime());
    endDate = aa.date.transToJavaUtilDate(toJSDate.getTime());

    var pms = aa.finance.getPaymentByDate(firstDate, endDate, null).getOutput()

    var RCount = 0;
    var RTotal = 0;

    removeASITable(tableName);

    //
    // load the required cashier ids from the receiptuser table
    //

    var UL = loadASITable("RECEIPTUSERS");

    var RA = new Array()

    if (!pms) return false;

    for (pmCount in pms) {
    
	var pm = pms[pmCount];

        var paymentCapId = aa.cap.getCapID(pm.getCapID().getID1(), pm.getCapID().getID2(), pm.getCapID().getID3()).getOutput();

	var paymentCapStatus = "" + aa.cap.getCap(paymentCapId).getOutput().getCapStatus();
	
        if (pm.getPaymentStatus().toUpperCase() != "PAID" && pm.getPaymentStatus().toUpperCase() != "REFUND"  && pm.getPaymentStatus().toUpperCase() != "VOIDED") continue;  // only paid, voided or refund payments

		var isVoid = (pm.getPaymentStatus().toUpperCase() == "VOIDED");
       // if (pm.getUdf1() != null) continue;  // already been reconciled and transmitted

        personModel = aa.person.getUser(pm.getCashierID()).getOutput();

        if (!personModel) continue; // online

	// stamp the branch.  Necessary since 11ACC-02768 sometimes causes the EMSE to not fire on payments

	var payBranch = pm.getUdf2();

	if (!payBranch)	{
		var bureauCode = personModel.getBureauCode() ;  
		if (bureauCode) updateBrCodeOnPayments(bureauCode, paymentCapId);
		payBranch = bureauCode;
		}
	
        if (branchString != null && !branchString.equals(payBranch)) continue; // filter by branch

        if (groupString != null && !groupString.equals(personModel.getDivisionCode())) continue; // filter by cashier group

        if (trxType != null && !trxType.equals(aa.cap.getCap(paymentCapId).getOutput().getCapType().toString())) continue; //filter by transaction type

        var receiptNum = pm.getReceiptNbr();
        var rm = null;
        if (receiptNum) rm = aa.finance.getReceiptByPK(receiptNum).getOutput();

        var tmpD = pm.getPaymentDate();
        var pd = tmpD.getMonth() + "/" + tmpD.getDayOfMonth() + "/" + tmpD.getYear()

        var RR = new Array()
        RR["License ID"] = new FieldInfo("License ID",paymentCapId.getCustomID(),"Y");
        RR["Branch"] = new FieldInfo("Branch", payBranch, "");
        RR["Type"] = new FieldInfo("Type", pm.getPaymentMethod(), "Y");
        RR["Transaction Type"] = new FieldInfo("Transaction Type",aa.cap.getCap(paymentCapId).getOutput().getCapType().toString(), "Y");
        if (rm)
            RR["Receipt Number"] = new FieldInfo("Receipt Number", "" + rm.getReceipt().getReceiptCustomizedNBR(), "Y");
        else
            RR["Receipt Number"] = new FieldInfo("Receipt Number","0", "Y");

		if (isVoid)
		{
		RR["Amount"] = new FieldInfo("Amount", "0","Y");
		}
		else
		{
		RR["Amount"] = new FieldInfo("Amount","" + pm.getPaymentAmount(),"Y");
		}
        RR["Payment Sequence"] = new FieldInfo("Payment Sequence","" + pm.getPaymentSeqNbr(),"Y");
        RR["Register"] = new FieldInfo("Register",pm.getRegisterNbr() != null ? "" + pm.getRegisterNbr() : "None", "Y");
        RR["Cashier"] = new FieldInfo("Cashier",pm.getCashierID(),"Y");

	// zero payments can only be exempts
	if (pm.getPaymentAmount() == 0)
		RR["Status"] = new FieldInfo("Status","Exempt","Y");
	else
		RR["Status"] = new FieldInfo("Status",pm.getPaymentStatus(),"Y");
		
	if (paymentCapStatus.equals("Cancelled") && !isVoid)
        	RR["Void Receipt"] = new FieldInfo("Void Receipt","UNCHECKED","");
        else
        	RR["Void Receipt"] = new FieldInfo("Void Receipt","","Y");

        RR["Date"] = new FieldInfo("Date",pd,"Y");
        
        var tnDesc = aa.cap.getCap(paymentCapId).getOutput().getCapModel().getSpecialText();
        
	if (!tnDesc) // get from LP
		{
		var payLPs = getLicenseProfessional(paymentCapId);
		if (payLPs) {
			for (i in payLPs) {
				tnDesc = payLPs[i].getBusName2(); }
			}
		}

	if (!tnDesc) // get from contacts	
		{
		var payContactResult = aa.people.getCapContactByCapID(paymentCapId);
		if (payContactResult.getSuccess())
			{
			var payContactArray = payContactResult.getOutput();
			for (var yy in payContactArray) {
				tnDesc = "";
				var c = payContactArray[yy].getCapContactModel();
				if (c.getFirstName() != null) tnDesc+=c.getFirstName() + " ";
				if (c.getLastName() != null) tnDesc+=c.getLastName() + " ";
				if (c.getBusinessName() != null) tnDesc+=c.getBusinessName();
				}
			}
		}
		
	if (!tnDesc || tnDesc.equals("")) // get from TSI (Title)
		{
		payTSI = new Array();
		tnDesc = "";
		loadTaskSpecific(payTSI,paymentCapId);
		if (payTSI["First Name"] != null && !payTSI["First Name"].equals("")) tnDesc+=payTSI["First Name"] + " ";
		if (payTSI["Last Name"] != null && !payTSI["Last Name"].equals("")) tnDesc+=payTSI["Last Name"] + " ";
		}


	if (!tnDesc || tnDesc.equals("")) // get from ASI (Cancelled CAP) (Title)
		{
		var cancelledCap = getAppSpecific("License Number",paymentCapId);
		
		if (cancelledCap != null && !cancelledCap.equals(""))
			{
			var payLP = getRefLicenseProf(cancelledCap.toUpperCase());
			if (payLP) {
				tnDesc = payLP.getLicenseModel().getBusName2(); 
				}
			}
		}
	
      		
        RR["Trade Name"] = new FieldInfo("Trade Name",tnDesc,"Y");
        RR["Record Status"] = new FieldInfo("Record Status",paymentCapStatus,"Y");
        //RR["Comments"] = new FieldInfo("Comments",pm.getPaymentComment() != null ? "" + pm.getPaymentComment() : "","Y");
        RA.push(RR);        
		if(!isVoid){
		RCount++;
        RTotal += pm.getPaymentAmount();}
    	}

    if (RA.length > 0) {
        logDebug("Adding " + RA.length + " records to table " + tableName);
        addASITable(tableName, RA);
        }
        var newDesc = "";
        if (branchString != null) newDesc += "Branch: " + branchString + " ";
        if (groupString != null) newDesc += "Group: " + groupString + " ";
        if (trxType != null) newDesc += "Transaction: " + trxType + " ";
        updateWorkDesc(newDesc);
        setFinancialDetails(fromDateString, toDateString, RCount, RTotal);
    
}

function loadSupervisorUsers(fromDateString, toDateString, branchString, groupString, tableName, trxType) {
	
	// optional 7th value is existing table, store the data
	
	var existingTable = null;
	if (arguments.length > 6)
			existingTable = arguments[6];


    // need to add one day since getPaymentByDate will not work for a single day!
    toDateString = dateAdd(toDateString,1);

    fromJSDate = new Date(fromDateString); fromJSDate.setHours(0); fromJSDate.setMinutes(0); fromJSDate.setSeconds(0); fromJSDate.setMilliseconds(0)
    toJSDate = new Date(toDateString); toJSDate.setHours(23); toJSDate.setMinutes(59); toJSDate.setSeconds(59); toJSDate.setMilliseconds(999)

    firstDate = aa.date.transToJavaUtilDate(fromJSDate.getTime());
    endDate = aa.date.transToJavaUtilDate(toJSDate.getTime());

    var pms = aa.finance.getPaymentByDate(firstDate, endDate, null).getOutput()

    var RCount = 0;
    var RTotal = 0;

    aa.appSpecificTableScript.removeAppSpecificTableInfos(tableName, capId, "DEDADMIN");

    var RA = new Array();
    var RTRX = new Array();
    var RAMT = new Array();
	var RACT = new Array();
	
    if (!pms) return false;

    for (pmCount in pms) {
        var pm = pms[pmCount];
        var paymentCapId = aa.cap.getCapID(pm.getCapID().getID1(), pm.getCapID().getID2(), pm.getCapID().getID3()).getOutput();

        if (pm.getPaymentStatus().toUpperCase() != "PAID" && pm.getPaymentStatus().toUpperCase() != "REFUND") continue;  // only paid or refund payments (no voids)

       // if (pm.getUdf1() != null) continue;  // already been reconciled and transmitted

        personModel = aa.person.getUser(pm.getCashierID()).getOutput();
        
        if (!personModel) continue; // online

	var payBranch = pm.getUdf2();

	if (!payBranch)	{
		var bureauCode = personModel.getBureauCode() ;  
		if (bureauCode) updateBrCodeOnPayments(bureauCode, paymentCapId);
		payBranch = bureauCode;
		}

        
        if (branchString != null && !branchString.equals(payBranch)) continue; // filter by branch

        if (groupString != null && !groupString.equals(personModel.getDivisionCode())) continue; // filter by cashier group

        if (trxType != null && !trxType.equals(aa.cap.getCap(paymentCapId).getOutput().getCapType().toString())) continue; //filter by transaction type


	if (RTRX[pm.getCashierID()]) RTRX[pm.getCashierID()] = RTRX[pm.getCashierID()] + 1; else RTRX[pm.getCashierID()] = 1;
	if (RAMT[pm.getCashierID()]) RAMT[pm.getCashierID()] = RAMT[pm.getCashierID()] + pm.getPaymentAmount(); else RAMT[pm.getCashierID()] = pm.getPaymentAmount();
	if (RACT[pm.getCashierID()]) 
	{
	
		if (aa.cap.getCap(paymentCapId).getOutput().getCapStatus() != "Cancelled")
		{
			RACT[pm.getCashierID()] = parseFloat(RACT[pm.getCashierID()]) + parseFloat(pm.getPaymentAmount());
		}
	}
	else
	{
		RACT[pm.getCashierID()] = "0";
		if (aa.cap.getCap(paymentCapId).getOutput().getCapStatus() != "Cancelled")
		{
			RACT[pm.getCashierID()] = parseFloat(pm.getPaymentAmount());
		}

	}
	
	}


	for (pmUser in RTRX)
		{
		var defaultLocked = "No";
		var defaultComments = "";
		
		if (existingTable)
			for (var tRow in existingTable)
			    {
				logDebug("comparing " + existingTable[tRow]["Cashier ID"].fieldValue + " to " + pmUser);
				if (existingTable[tRow]["Cashier ID"].fieldValue == pmUser)
					{
					defaultLocked = existingTable[tRow]["Lock Payments"].fieldValue;
					defaultComments = existingTable[tRow]["Comments"].fieldValue;
					}
				}
					
		var RR = new Array();
		RR["Cashier ID"] = new FieldInfo("Cashier ID",pmUser,"Y");
		RR["Cashier Name"] = new FieldInfo("Cashier Name",aa.person.getUser(pmUser).getOutput().getFullName(),"Y");
		//RR["Amount Collected"] = new FieldInfo("Amount Collected", defaultCollected, "N");
		RR["Number of Payments"] = new FieldInfo("Number of Payments", "" + RTRX[pmUser], "Y");
		RR["Amount of Payments"] = new FieldInfo("Amount of Payments", "" + RAMT[pmUser], "Y");
		RR["Actual Amount"] = new FieldInfo("Actual Amount", "" + RACT[pmUser], "Y");
		RR["Lock Payments"] = new FieldInfo("Lock Payments", defaultLocked, "N");
		RR["Comments"] = new FieldInfo("Comment",defaultComments,"N");
		RA.push(RR);
	    }

	    if (RA.length > 0) {
        logDebug("Adding " + RA.length + " records to table " + tableName);
        addASITable(tableName, RA);
    }
}
function processReceiptBrChanges(currentBr,newTable)
	{
	var c = aa.proxyInvoker.newInstance("com.accela.aa.finance.cashier.CashierBusiness").getOutput(); 

	for (var i in newTable)
		{
		var thisSeq = newTable[i]["Payment Sequence"].fieldValue;
		var thisRec = newTable[i]["License ID"].fieldValue;
		var thisBranch = newTable[i]["Branch"].fieldValue;
		
		if (!currentBr.equals(thisBranch))
			{
			var itemCap = aa.cap.getCapID(thisRec).getOutput();
			var itemSeq = parseInt(thisSeq);
			
			var pm = c.getPaymentByPK(itemCap,itemSeq,null);

			pm.setUdf2(thisBranch);
			c.updatePayment(pm);
			logDebug("Transfered payment " + pm.getPaymentSeqNbr() + " from " + currentBr + " to " + thisBranch);
			}
		}
	}

function removeActivityFees(itemCap, feeAccCode) // Removes all non-invoiced fee items for a CAP ID  that are associated with an Activity or an Activity Credit
	{
	getFeeResult = aa.finance.getFeeItemByCapID(itemCap);
	if (getFeeResult.getSuccess())
		{
		var feeList = getFeeResult.getOutput();
		for (feeNum in feeList)
			{
			if (feeList[feeNum].getFeeitemStatus().equals("NEW") && feeList[feeNum].getAccCodeL1() == feeAccCode && (feeList[feeNum].getFeeCod() == 'ACTIVITY' || feeList[feeNum].getFeeCod() == 'CREDIT'))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();

				var editResult = aa.finance.removeFeeItem(itemCap, feeSeq);
				if (editResult.getSuccess())
					{
					//aa.print("Removed existing Fee Item: " + feeList[feeNum].getFeeCod());
					}
				else
					{ //aa.print( "**ERROR: removing fee item (" + feeList[feeNum].getFeeCod() + "): " + editResult.getErrorMessage()); 
					break; }
				}
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
				//aa.print("Invoiced fee "+feeList[feeNum].getFeeCod()+" found, not removed");
				}
			}
		}
	else
		{ //aa.print( "**ERROR: getting fee items (" + feeList[feeNum].getFeeCod() + "): " + getFeeResult.getErrorMessage())
		}

	}

	function removeAddresses(itemCap)
  	{
	var addRemResult = aa.address.getAddressWithAttributeByCapId(itemCap);

	if (!addRemResult.getSuccess())
		{ logDebug("**WARNING: error retrieving addresses" + addResult.getErrorMessage()) ; return false }

	var addRemArray = addRemResult.getOutput();


	for (thisRemAdd in addRemArray)
		{
                addRemArray[thisRemAdd].setPrimaryFlag("N");
                aa.address.editAddress(addRemArray[thisRemAdd]);
                var addId = addRemArray[thisRemAdd].getAddressId();
		var result = aa.address.getAssignedAddressDistrictForDaily(itemCap.getID1(),itemCap.getID2(),itemCap.getID3(),addId);
		if (result.getSuccess())
		 	{
		 	addrDistArray = result.getOutput();
		 	if (addrDistArray) for (var x1 in addrDistArray)
		 		{
		 		logDebug("deleting district " + addrDistArray[x1].getDistrict());
		 		aa.address.deleteAddressDistrictForDaily(itemCap.getID1(),itemCap.getID2(),itemCap.getID3(),addId,addrDistArray[x1].getDistrict());
		 		}
		 	}		
		removeAdd = aa.address.removeAddressWithLogic(itemCap,addId);
                logDebug(removeAdd.getSuccess());
                }

	logDebug("Successfully removed all address from CAP");

	}
	
function removeContacts(itemCap)
  	{
	var contResult = aa.people.getCapContactByCapID(itemCap)

	if (!contResult.getSuccess())
		{ logDebug("**WARNING: error retrieving contacts" + contResult.getErrorMessage()) ; return false }

	var contArray = contResult.getOutput();

	for (thisCont in contArray)
		{
		var contID = contArray[thisCont].getCapContactModel().getPeople().getContactSeqNumber();
        aa.people.removeCapContact(itemCap,contID);
        }

	logDebug("Successfully removed all address from CAP");

	}
	
function removeLicensedProfessional(lsm)  {


                // takes a licenseScriptModel and deletes it, along with public user associations
                
                var lic = aa.proxyInvoker.newInstance("com.accela.aa.aamain.people.LicenseBusiness").getOutput();
                var clb = aa.proxyInvoker.newInstance("com.accela.pa.people.license.ContractorLicenseBusiness").getOutput();

                if (lsm)
                   {
                   lm = lsm.getLicenseModel();
                   licenseNumber = lsm.getLicSeqNbr();

                   pubusers = aa.publicUser.getPublicUserListByLicenseSeqNBR(licenseNumber).getOutput().toArray();

                   for (p1 in pubusers)
                                {
                                pu = pubusers[p1].getUserSeqNum();
                                clb.deleteContractorLicense(pu, lsm.getLicenseType(),lsm.getAgencyCode(),licenseNumber);
                                logDebug("deleted association to public user: " + pubusers[p1].getUserID()); 
                                }

                   lic.removeLicenseByPK(lm);
                   logDebug(licenseNumber + "has been deleted");
                   }
                }
				
function replaceNode(fString,fName,fContents)
        {
         var fValue = "";
        var startTag = "<"+fName;
         var endTag = "</"+fName+">";
		// Take into consideration tag namespace, if any.
		var startPos = fString.indexOf(">", fString.indexOf(startTag)) + 1;
                 endPos = fString.indexOf(endTag);
                 // make sure startPos and endPos are valid before using them
                 if (startPos > 0 && startPos <= endPos)
                                {
                                  fValue = fString.substring(0,startPos) + fContents  + fString.substring(endPos);
                                        return unescape(fValue);
                        }

        }
function right(fullStr,numChars)
	{
	var tmpStr = fullStr.toString();
	return tmpStr.substring(tmpStr.length()-numChars,tmpStr.length());
	}
function sendMessage(subjKey,messageKey)
	{

	var mSubj = aa.messageResources.getLocalMessage(subjKey);
	var mMesg = aa.messageResources.getLocalMessage(messageKey);

	var SMSSend = false;
	var SMSAddr = null;
	var emailSend = false;
	var emailAddr = null;

	var contactType = "Applicant";

	var replyTo = "noreply@adeconomy.ae";
	var contactType = "Applicant"
	var emailAddress = "";

	// check to see if ACA user?  do we pull from here or the contact

   	var publicUser = aa.licenseScript.getPublicUserByUserName(cap.getAuditID()); //PublicUser Object

	if (publicUser)
		{
		if (publicUser.getReceiveSMS() == "Y")
			{
			SMSAddr = publicUser.getCellPhone()
			if (SMSAddr) SMSSend = true;
			}
		else
			{
			emailAddr = publicUser.getEmail();
			if (emailAddr) emailSend = true;
			}
		}
	else

	//  Use the contact.   Not sure where the SMS would be on here.  TBD

		{
		var capContactResult = aa.people.getCapContactByCapID(capId);
		if (capContactResult.getSuccess())
			{
			var Contacts = capContactResult.getOutput();
			for (yy in Contacts)
				if (contactType.equals(Contacts[yy].getCapContactModel().getPeople().getContactType()))
					if (Contacts[yy].getEmail() != null)
						{
						emailAddr = Contacts[yy].getEmail();
						customerFullName = Contacts[yy].getFirstName() + " " + Contacts[yy].getLastName();
						if (emailAddr) emailSend = true;
						}
			}
		}



	if (mSubj) mSubj = replaceMessageTokens(mSubj);	else { logDebug("**WARNING Message subject missing " + subjKey); return false;}

	if (mMesg) mMesg = replaceMessageTokens(mMesg); else { logDebug("**WARNING Message missing " + messageKey); return false;}


	if (emailSend)
		{
		aa.sendMail(replyTo, emailAddr, "", mSubj, mMesg);
		logDebug("Successfully sent email to " + contactType);
		logDebug("Successfully sent email to " + emailAddr + ": Subject:" + mSubj + " Message:" + mMesg);
		}

	if (SMSSend)
		{
		// need SMS routine
		logDebug("I would have sent an SMS to " + SMSAddr + " If I could.  Text: " + mMesg);
		}
	}

function sendSMS(messageReceiver,messageBody)
        {
        /*------------------------------------------------------------------------------------------------------/
        | START Location Configurable Parameters
        | Parameters should be set in the 'SMS_INTERFACE_PARAMETERS' standard choice, only default values
	| should be updated in the below code block
        /------------------------------------------------------------------------------------------------------*/
	var wsURL = lookup("SMS_INTERFACE_PARAMETERS","wsURL");
	if(wsURL=="null") wsURL = "";
	var wsUser = lookup("SMS_INTERFACE_PARAMETERS","wsUsername");
	if(wsUser =="null") wsUser = "";
	var wsPassword = lookup("SMS_INTERFACE_PARAMETERS","wsPassword");
	if(wsPassword  =="null") wsPassword = "";
	var wsSOAPAction = lookup("SMS_INTERFACE_PARAMETERS","wsSOAPAction");
	if(wsSOAPAction =="null") wsSOAPAction = "";

	var credAgentID = lookup("SMS_INTERFACE_PARAMETERS","credAgentID");
	if(credAgentID =="null") credAgentID = "";
	var credUserName = lookup("SMS_INTERFACE_PARAMETERS","credUsername");
	if(credUserName =="null") credUserName = "";
	var credPassword = lookup("SMS_INTERFACE_PARAMETERS","credPassword");
	if(credPassword =="null") credPassword = "";
	var messageFrom = lookup("SMS_INTERFACE_PARAMETERS","messageFrom");
	if(messageFrom =="null") messageFrom = "DPE";
	var messageUnicode = lookup("SMS_INTERFACE_PARAMETERS","messageUnicode");
	if(messageUnicode =="null") messageUnicode = "true";
        /*------------------------------------------------------------------------------------------------------/
        | END Location Configurable Parameters
        /------------------------------------------------------------------------------------------------------*/

      soapOut = "<?xml version=\"1.0\" encoding=\"utf-8\"?><soap12:Envelope xmlns:xsi=\"http://www.w3.org/2001/XMLSchema-instance\" xmlns:xsd=\"http://www.w3.org/2001/XMLSchema\" xmlns:soap12=\"http://www.w3.org/2003/05/soap-envelope\"><soap12:Body><SendSMS xmlns=\"http://SMService\"><SendSMSRequest><MessageDataContractMessagePart><From xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></From><Receiver xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></Receiver><Body xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></Body><IsUniCode xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></IsUniCode></MessageDataContractMessagePart><CredentialsPart><AgentId xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></AgentId><UserName xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></UserName><Password xmlns=\"http://dpe.ae/ShortMessageService/DataContract/CommonTypes/2009/5\"></Password></CredentialsPart></SendSMSRequest></SendSMS></soap12:Body></soap12:Envelope>"
      
      soapOut = replaceNode(soapOut,"AgentId",credAgentID)
	  soapOut = replaceNode(soapOut,"UserName",credUserName)
	  soapOut = replaceNode(soapOut,"Password",credPassword)
	  soapOut = replaceNode(soapOut,"From",messageFrom)
	  soapOut = replaceNode(soapOut,"Receiver",messageReceiver)
	  soapOut = replaceNode(soapOut,"Body",messageBody)
	  soapOut = replaceNode(soapOut,"IsUniCode",messageUnicode)	  

	  
        //aa.print("Outbound SOAP: " + soapOut);

        returnObj = aa.util.httpPostToSoapWebService(wsURL, soapOut, wsUser, wsPassword, wsSOAPAction);

        if (!returnObj.getSuccess())
                {
                //aa.print("*SOAP ERROR Type******\n" + returnObj.getErrorType() + "\n");
                //aa.print("*SOAP ERROR Message******\n" + returnObj.getErrorMessage() + "\n");
                }
        else
                {
                //aa.print("****** SOAP Response ******\n" + returnObj.getOutput() + "\n");
                }
        }

function setFinancialDetails(receiptfromdate,receipttodate,numreceipts,totalamount) // option CapId
	{
	var itemCap = capId
	if (arguments.length > 5) itemCap = arguments[4]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }


	cdScriptObj.setAsgnDate(aa.date.parseDate(receiptfromdate));

	cd = cdScriptObj.getCapDetailModel();

	cd.setEstJobCost(parseFloat(totalamount));
	cd.setEstProdUnits(parseFloat(numreceipts));
	cd.setAppearanceDate(aa.date.transToJavaUtilDate(new Date(receipttodate).getTime()));

	cdWrite = aa.cap.editCapDetail(cd)

	if (!cdWrite.getSuccess())
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}

function setFinancialUserDetails(userTable) // option CapId
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	var rCount = 0;
	var rTotal = 0;

	if (userTable && userTable.length > 0)
		for (thisUser in userTable)
			{
			RR = userTable[thisUser];
			if (RR["Lock Payments"].fieldValue == "Yes")
				{
				rCount += parseInt(RR["Number of Payments"].fieldValue);
				rTotal += parseInt(RR["Amount of Payments"].fieldValue);
				}	
		    	}
	
	cd = cdScriptObj.getCapDetailModel();

	cd.setActualProdUnits((cd.getEstProdUnits()-rCount)); // number of trx not yet reconciled
	cd.setCostPerUnit((cd.getEstJobCost() - rTotal));    // amount not reconciled

	cdWrite = aa.cap.editCapDetail(cd)

	if (!cdWrite.getSuccess())
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}


function setFinancialUserDetails(userTable) // option CapId
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	var rCount = 0;
	var rTotal = 0;

	if (userTable && userTable.length > 0)
		for (thisUser in userTable)
			{
			RR = userTable[thisUser];

			if (RR["Lock Payments"].fieldValue == "Yes")
				{
				rCount += parseInt(RR["Number of Payments"].fieldValue);
				rTotal += parseInt(RR["Amount of Payments"].fieldValue);
				}	
		    	}
	
	cd = cdScriptObj.getCapDetailModel();

	cd.setActualProdUnits((cd.getEstProdUnits()-rCount)); // number of trx not yet reconciled
	cd.setCostPerUnit((cd.getEstJobCost() - rTotal));    // amount not reconciled

	cdWrite = aa.cap.editCapDetail(cd)

	if (!cdWrite.getSuccess())
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}
function taskDeActivateAllExcept()
	{
	// Closes all tasks in CAP with specified status and comment
	// Optional task names to exclude
	// 06SSP-00152
	//
	var taskArray = new Array();
	var deActivateAll = false;
	if (arguments.length > 0) //Check for task names to exclude
		{
		for (var i=0; i<arguments.length; i++)
			taskArray.push(arguments[i]);
		}
	else
		deActivateAll = true;

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  else
  	{
		logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage());
		return false;
		}

	var fTask;
	var stepnumber;
	var processID;
	var dispositionDate = aa.date.getCurrentDate();
	var wfnote = " ";
	var wftask;

	for (i in wfObj)
		{
   	fTask = wfObj[i];
		wftask = fTask.getTaskDescription();
		stepnumber = fTask.getStepNumber();
		processID = fTask.getProcessID();
                var completeFlag = fTask.getCompleteFlag();
		if (deActivateAll)
			{
			aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null);
			logMessage("DeActivating Workflow Task " + wftask);
			logDebug("DeActivating Workflow Task " + wftask);
			}
		else
			{
			if (!exists(wftask,taskArray))
				{
				aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null);
				logMessage("DeActivating Workflow Task " + wftask);
				logDebug("DeActivating Workflow Task " + wftask);
				}
			}
		}
	}

function trim(trimString, leftTrim, rightTrim) {
    var whitespace = "\n\r\t ";

	if (leftTrim == null) {
        leftTrim = true;
    }

    if (rightTrim == null) {
        rightTrim = true;
    }

    var left=0;
    var right=0;
    var i=0;
    var k=0;

    // modified to properly handle strings that are all whitespace
    if (leftTrim == true) {
        while ((i<trimString.length()) && (whitespace.indexOf(trimString.charAt(i++))!=-1)) {
            left++;
        }
    }
    if (rightTrim == true) {
        k=trimString.length()-1;
        while((k>=left) && (whitespace.indexOf(trimString.charAt(k--))!=-1)) {
            right++;
        }
    }
    return trimString.substring(left, trimString.length() - right);
}

	function updateBrCodeOnPayments(brCode) // optional Cap ID
		{
		var itemCap = capId;
		if (arguments.length == 2) itemCap = arguments[1];

		var c = aa.proxyInvoker.newInstance("com.accela.aa.finance.cashier.CashierBusiness").getOutput(); 

		var p = c.getPaymentByCapID(itemCap,null,null).toArray()

		for (thisP in p)
			{
			var pm = p[thisP];
			if (!pm.getUdf2())
				{
				pm.setUdf2(brCode);
				c.updatePayment(pm);
				logDebug("Updated Udf2 code on payment " + pm.getPaymentSeqNbr() + " to " + brCode);
				}
			}
		}
		
function voidApprovingEntityFees(tCapId,itemCap)
	{
	var feeSeqArray = new Array();
	var invoiceNbrArray = new Array();
	var feeAllocationArray = new Array();


	// loop through all fees
	//
	//    skip all non-refundable fees that contain "-NR"
	//
	// for each fee found
	//    find a corresponding fee on the target Cap
	//  	  if the fee is "NEW" remove it
	//  	  if the fee is "INVOICED" void it and invoice the void
	//

	var sourceFees = loadFees(tCapId);

	for (var feeNum in sourceFees)
			{
			var thisFee = sourceFees[feeNum];

			// added 7/27/09 JHS
			if (thisFee.accCodeL1 == "340670") continue; // skip DED fees

			//if (thisFee.code.substr(0,3).equals("DPE")) continue;  // it is a DPE fee  -- removed 6/23/09 JHS

			if (thisFee.description.indexOf("-NR") > 0) continue;  // non-refundable

			if (thisFee.status != "INVOICED" && thisFee.status != "NEW") continue;  // already refunded or some other status

			//aa.print("We have a fee " + thisFee.code + " status : " + thisFee.status);

			var targetFees = loadFees(itemCap);

			for (tFeeNum in targetFees)
				{
				targetFee = targetFees[tFeeNum];

				if (targetFee.code.equals(thisFee.code)) // remove 7/27/09 JHS & DB  //  && targetFee.amount == thisFee.amount)
					{

					// only remove invoiced or new fees, however at this stage all AE fees should be invoiced.

					if (targetFee.status == "INVOICED")
						{
						var editResult = aa.finance.voidFeeItem(itemCap, targetFee.sequence);

						if (editResult.getSuccess())
							logDebug("Voided existing Fee Item: " + targetFee.code);
						else
							{ logDebug( "**ERROR: voiding fee item (" + targetFee.code + "): " + editResult.getErrorMessage()); return false; }

						var feeSeqArray = new Array();
						var paymentPeriodArray = new Array();

						feeSeqArray.push(targetFee.sequence);
						paymentPeriodArray.push(targetFee.period);
						var invoiceResult_L = aa.finance.createInvoice(itemCap, feeSeqArray, paymentPeriodArray);

						if (!invoiceResult_L.getSuccess())
							{
							logDebug("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
							return false;
							}

						break;  // done with this payment
						}



					if (targetFee.status == "NEW")
						{
						// delete the fee
						var editResult = aa.finance.removeFeeItem(itemCap, targetFee.sequence);

						if (editResult.getSuccess())
							logDebug("Removed existing Fee Item: " + targetFee.code);
						else
							{ logDebug( "**ERROR: removing fee item (" + targetFee.code + "): " + editResult.getErrorMessage()); return false; }

						break;  // done with this payment
						}

					} // each matching fee
				}  // each license fee
			}  // each template fee
		}

		function voidDEDFees(itemCap)
	{
	var feeSeqArray = new Array();
	var invoiceNbrArray = new Array();
	var feeAllocationArray = new Array();

	// loop through all fees
	//
	// for each fee found
	//  	  if the fee is "INVOICED" void it and invoice the void
	//

	var sourceFees = loadFees(itemCap);

	for (var feeNum in sourceFees)
			{
			var thisFee = sourceFees[feeNum];

			if ((thisFee.accCodeL1 == "340670" || thisFee.accCodeL1 == "323100" || thisFee.accCodeL1 == "323300") && thisFee.status == "INVOICED")
						{
						var editResult = aa.finance.voidFeeItem(itemCap, thisFee.sequence);

						if (editResult.getSuccess())
							logDebug("Voided existing Fee Item: " + thisFee.code);
						else
							{ logDebug( "**ERROR: voiding fee item (" + thisFee.code + "): " + editResult.getErrorMessage()); return false; }

						var feeSeqArray = new Array();
						var paymentPeriodArray = new Array();

						feeSeqArray.push(thisFee.sequence);
						paymentPeriodArray.push(thisFee.period);
						var invoiceResult_L = aa.finance.createInvoice(itemCap, feeSeqArray, paymentPeriodArray);

						if (!invoiceResult_L.getSuccess())
							{
							logDebug("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
							return false;
							}

						}

			}  // each template fee
	}
//Custom for WorkflowTaskUpdateBefore//////////////////////////////////////////////////

function Left(str, n){
	if (n <= 0)
	    return "";
	else if (n > String(str).length)
	    return str;
	else
	    return String(str).substring(0,n);
}
function contactArray()
{
var contactList = aa.env.getValue("ContactList");
var cArray = new Array();
if(contactList != null)
	{
	var its = contactList.iterator();

	while(its.hasNext())
		{
			var aArray = new Array();
			var peopleModel = its.next().getPeople();
			aArray["firstName"] = peopleModel.getFirstName();
			aArray["lastName"] = peopleModel.getLastName();
			aArray["contactSeqNumber"] = peopleModel.getContactSeqNumber();
			aArray["contactType"] = peopleModel.getContactType();
			aArray["relation"] = peopleModel.getRelation();
			aArray["businessName"] = peopleModel.getBusinessName();
			aArray["email"] = peopleModel.getEmail();
			aArray["FEIN"] = peopleModel.getFein();
			aArray["phone1"] = peopleModel.getPhone1();
			aArray["phone2"] = peopleModel.getPhone2();
			aArray["phone2countrycode"] = peopleModel.getPhone2CountryCode();
			aArray["addressLine1"] = peopleModel.getCompactAddress().getAddressLine1();
			aArray["addressLine2"] = peopleModel.getCompactAddress().getAddressLine2();
			aArray["city"] = peopleModel.getCompactAddress().getCity();
			aArray["state"] = peopleModel.getCompactAddress().getState();
			aArray["zip"] = peopleModel.getCompactAddress().getZip();
			aArray["country"] = peopleModel.getCompactAddress().getCountry();
			aArray["fullName"] = peopleModel.getFullName;

			var pa = peopleModel.getAttributes().toArray();
				for (xx1 in pa)
							aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
			cArray.push(aArray);
		}
	}
	return cArray;

}

function createRefLicProf(rlpId,rlpType,pContactType)
	{
	//Creates/updates a reference licensed prof from a Contact
	//06SSP-00074, modified for 06SSP-00238
	var updating = false;
	var capContResult = aa.people.getCapContactByCapID(capId);
	if (capContResult.getSuccess())
		{ conArr = capContResult.getOutput();  }
	else
		{
		logDebug ("**ERROR: getting cap contact: " + capAddResult.getErrorMessage());
		return false;
		}

	if (!conArr.length)
		{
		logDebug ("**WARNING: No contact available");
		return false;
		}


	var newLic = getRefLicenseProf(rlpId)

	if (newLic)
		{
		updating = true;
		logDebug("Updating existing Ref Lic Prof : " + rlpId);
		}
	else
		var newLic = aa.licenseScript.createLicenseScriptModel();

	//get contact record
	if (pContactType==null)
		var cont = conArr[0]; //if no contact type specified, use first contact
	else
		{
		var contFound = false;
		for (yy in conArr)
			{
			if (pContactType.equals(conArr[yy].getCapContactModel().getPeople().getContactType()))
				{
				cont = conArr[yy];
				contFound = true;
				break;
				}
			}
		if (!contFound)
			{
			logDebug ("**WARNING: No Contact found of type: "+pContactType);
			return false;
			}
		}

	peop = cont.getPeople();
	addr = peop.getCompactAddress();

	newLic.setContactFirstName(cont.getFirstName());
	//newLic.setContactMiddleName(cont.getMiddleName());  //method not available
	newLic.setContactLastName(cont.getLastName());
	newLic.setBusinessName(peop.getBusinessName());
	newLic.setAddress1(addr.getAddressLine1());
	newLic.setAddress2(addr.getAddressLine2());
	newLic.setAddress3(addr.getAddressLine3());
	newLic.setCity(addr.getCity());
	newLic.setState(addr.getState());
	newLic.setZip(addr.getZip());
	newLic.setPhone1(peop.getPhone1());
	newLic.setPhone2(peop.getPhone2());
	newLic.setEMailAddress(peop.getEmail());
	newLic.setFax(peop.getFax());

	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setAuditID(currentUserID);
	newLic.setAuditStatus("A");

	if (AInfo["Insurance Co"]) 		newLic.setInsuranceCo(AInfo["Insurance Co"]);
	if (AInfo["Insurance Amount"]) 		newLic.setInsuranceAmount(parseFloat(AInfo["Insurance Amount"]));
	if (AInfo["Insurance Exp Date"]) 	newLic.setInsuranceExpDate(aa.date.parseDate(AInfo["Insurance Exp Date"]));
	if (AInfo["Policy #"]) 			newLic.setPolicy(AInfo["Policy #"]);

	if (AInfo["Business License #"]) 	newLic.setBusinessLicense(AInfo["Business License #"]);
	if (AInfo["Business License Exp Date"]) newLic.setBusinessLicExpDate(aa.date.parseDate(AInfo["Business License Exp Date"]));

	newLic.setLicenseType(rlpType);
	newLic.setLicState(addr.getState());
	newLic.setStateLicense(rlpId);

	if (updating)
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	else
		myResult = aa.licenseScript.createRefLicenseProf(newLic);

	if (myResult.getSuccess())
		{
		logDebug("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
		logMessage("Successfully added/updated License No. " + rlpId + ", Type: " + rlpType);
		return true;
		}
	else
		{
		logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		logMessage("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage());
		return false;
		}
	}
	
function getCapTypeByAltID(altID)
{
	myCap = aa.cap.getCapID(altID).getOutput()
	capType = aa.cap.getCap(myCap).getOutput().getCapType()

	return capType;


}

function getLastActivityAmendment(customId)
{
	var activityTemp = "";
	var result = "";
	var found = false;
	var capId = aa.cap.getCapID(customId).getOutput();
	var parentCapId = getParent(capId);
	
	ActivitiesCA = loadASITable("COMMERCIAL ACTIVITIES", capId);
	ActivitiesCN = loadASITable("COMMERCIAL ACTIVITIES", parentCapId);
	
	
	for(a in ActivitiesCA)
	{
		activityTemp = aa.cap.getCapID(ActivitiesCA[a]["Activity ID"].fieldValue).getOutput();
		found = false;
		for(n in ActivitiesCN)
		{			
			if(ActivitiesCA[a]["Activity ID"].fieldValue.equals(ActivitiesCN[n]["Activity ID"].fieldValue))
			{
				found = true;
			}
		}
		if (!found)
		{
			result+=aa.messageResources.getLocalMessage("message.amend.activityadd") + "  " + getAppSpecific("Arabic Name", activityTemp) + " \n";
		}
	}
	for(n in ActivitiesCN)
	{
		activityTemp = aa.cap.getCapID(ActivitiesCN[n]["Activity ID"].fieldValue).getOutput();
		found = false;
		for(a in ActivitiesCA)
		{			
			if(ActivitiesCN[n]["Activity ID"].fieldValue.equals(ActivitiesCA[a]["Activity ID"].fieldValue))
			{
				found = true;
			}
		}
		if (!found)
		{
			result+=aa.messageResources.getLocalMessage("message.amend.activityremove") + "  " + getAppSpecific("Arabic Name", activityTemp) + " \n";
		}
	}
	return result;
}

function getLastTradenameAmendment(customId)
{

	var result = "";
	var capId = aa.cap.getCapID(customId).getOutput();
	var parentCapId = getParent(capId);
	
	licprofArrCA = getLicenseProfessional(capId);
	licprofArrCN = getLicenseProfessional(parentCapId);
	
	if(licprofArrCA.length!=2 || licprofArrCN.length!=2)
	{
		logDebug("CAPs must have exactly 2 licensed professionals. Check data");
		return false;
	}
	if (licprofArrCA[1].getLicenseType().toUpperCase().equals("TRADE NAME"))
	{
		result+= aa.messageResources.getLocalMessage("message.amend.tradename") + " " + licprofArrCN[1].getBusinessName() + " - " + licprofArrCN[1].getBusName2() + " "+aa.messageResources.getLocalMessage("message.keywords.to") +" " + licprofArrCA[1].getBusinessName() + " - " + licprofArrCA[1].getBusName2() + "\n";
	}
	
	return result;
}
function getLastAppSpecificAmendments(customId)
{
	var result = "";
	var capId = aa.cap.getCapID(customId).getOutput();
	var parentCapId = getParent(capId);
	
	capitalCA = getAppSpecific("Capital", capId);
	capitalCN = getAppSpecific("Capital", parentCapId);
	originCA = getAppSpecific("Country of origin", capId);
	originCN = getAppSpecific("Country of origin", parentCapId);
	licenseCA = getAppSpecific("License Type", capId);
	licenseCN = getAppSpecific("License Type", parentCapId);
	legalFormCA = getAppSpecific("Legal Form", capId);
	legalFormCN = getAppSpecific("Legal Form", parentCapId);
	
	if(capitalCA && !capitalCA.equals(capitalCN))
	{
		result+=aa.messageResources.getLocalMessage("message.amend.capital")+" "+ capitalCN +" " +aa.messageResources.getLocalMessage("message.keywords.to") +" "+ capitalCA + " " + "\n";
	}
	
	if(originCA && !originCA.equals(originCN))
	{
		result+=aa.messageResources.getLocalMessage("message.amend.companycountry") + " " + aa.bizDomain.getBizDomainByValue("Country of Origin",originCN,"ar_AE").getOutput().getDispBizdomainValue() + " " + aa.messageResources.getLocalMessage("message.keywords.to") + " " + aa.bizDomain.getBizDomainByValue("Country of Origin",originCA,"ar_AE").getOutput().getDispBizdomainValue() + "\n";
	}	
	
	if(licenseCA && !licenseCA.equals(licenseCN))
	{
		result+=aa.messageResources.getLocalMessage("message.amend.licensetype")+" "+ aa.bizDomain.getBizDomainByValue("License Type",licenseCN,"ar_AE").getOutput().getDispBizdomainValue()  +" "+aa.messageResources.getLocalMessage("message.keywords.to") +" "+ aa.bizDomain.getBizDomainByValue("License Type",licenseCA,"ar_AE").getOutput().getDispBizdomainValue()+ "\n";
	}
	
	if(legalFormCA && !legalFormCA.equals(legalFormCN))
	{
		result+=aa.messageResources.getLocalMessage("message.amend.legalform")+" "+ aa.bizDomain.getBizDomainByValue("Legal Forms",legalFormCN,"ar_AE").getOutput().getDispBizdomainValue() +" "+aa.messageResources.getLocalMessage("message.keywords.to") +" "+ aa.bizDomain.getBizDomainByValue("Legal Forms",legalFormCA,"ar_AE").getOutput().getDispBizdomainValue()+ "\n";
	}

	return result;
}
function getLastContactAmendments(customId)
{
	//fish 01/25/2011
	//customId as amendment CAP
	//Returns a string with the delta between an amendment CAP and its parent license CAP
	var repType = "";
	var result = "";
	var found = false;
	var capId = aa.cap.getCapID(customId).getOutput();
	var parentCapId = getParent(capId);
	var capContactArray = aa.people.getCapContactByCapID(capId);
    var parentCapContactArray = aa.people.getCapContactByCapID(parentCapId);
	
	if (!capContactArray.getSuccess())
	{
		logDebug("Problem getting CapID " + capContactArray.getErrorMessage())
	}
	else
	{
		capContactArray = capContactArray.getOutput();
	}
	
		if (!parentCapContactArray.getSuccess())
	{
		logDebug("Problem getting CapID " + parentCapContactArray.getErrorMessage())
	}
	else
	{
		parentCapContactArray = parentCapContactArray.getOutput();
	}
	
	for(c in capContactArray)
	{
		firstName = capContactArray[c].getPeople().getFirstName(); 
		secondName = capContactArray[c].getPeople().getFullName();
		middleName = capContactArray[c].getPeople().getMiddleName();
		lastName = capContactArray[c].getPeople().getLastName();
		if (firstName == null)  firstName = ""; else firstName = firstName + " ";
		if (secondName == null)  secondName = ""; else secondName = secondName + " ";
		if (middleName == null)  middleName = ""; else middleName = middleName + " ";
		if(lastName == null) lastName = "";
		
		fullName = firstName + secondName + middleName + lastName;
		
		found = false;
		if (capContactArray[c].getPeople().getContactType().equals("Applicant"))
		{
			continue;
		}
		for (p in parentCapContactArray)
		{
			if(capContactArray[c].getCapContactModel().getRefContactNumber() && capContactArray[c].getCapContactModel().getRefContactNumber().equals(parentCapContactArray[p].getCapContactModel().getRefContactNumber()))
			{
				found = true;
				
				logDebug("Getting Attributes for contact " + capContactArray[c].getPeople().getFirstName());
				attributesCA = capContactArray[c].getPeople().getAttributes().toArray();
				
				logDebug("Getting Attributes for contact " + parentCapContactArray[p].getPeople().getFirstName())
				attributesCN = parentCapContactArray[p].getPeople().getAttributes().toArray();

				for (a in attributesCA)
				{
					for (n in attributesCN)
					{
						if(attributesCA[a].attributeName.equals("SHARE PERCENTAGE") && attributesCN[n].attributeName.equals("SHARE PERCENTAGE"))
						{
							if(attributesCA[a].attributeValue && !attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue) && capContactArray[c].getPeople().getContactType().equals("Individual"))
							{
								result+=aa.messageResources.getLocalMessage("message.amend.partnersshares") + " " + fullName + " " +aa.messageResources.getLocalMessage("message.keywords.from") + " " + attributesCN[n].attributeValue + "% " +aa.messageResources.getLocalMessage("message.keywords.to") + " " + attributesCA[a].attributeValue + "%\n";
							}
							else if(attributesCA[a].attributeValue && !attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue) && !capContactArray[c].getPeople().getContactType().equals("Individual"))
							{
							result+=aa.messageResources.getLocalMessage("message.amend.partnersshares") + " " + capContactArray[c].getPeople().getBusinessName() + " " + capContactArray[c].getPeople().getTradeName() + " " +aa.messageResources.getLocalMessage("message.keywords.from") + " " + attributesCN[n].attributeValue + "% " +aa.messageResources.getLocalMessage("message.keywords.to") + " " + attributesCA[a].attributeValue + "%\n";
							}
						}
						else if(attributesCA[a].attributeName.equals("NATIONALITY") && attributesCN[n].attributeName.equals("NATIONALITY"))
						{
							if(attributesCA[a].attributeValue && !attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue))
							{
								result+=aa.messageResources.getLocalMessage("message.amend.partnersnationality")+ " " + fullName + " " + aa.messageResources.getLocalMessage("message.keywords.from") + " " + aa.bizDomain.getBizDomainByValue("Nationality",attributesCN[n].attributeValue,"ar_AE").getOutput().getDispBizdomainValue() + " " + aa.messageResources.getLocalMessage("message.keywords.to") + " " + aa.bizDomain.getBizDomainByValue("Nationality",attributesCA[a].attributeValue,"ar_AE").getOutput().getDispBizdomainValue() + "\n";
							}
						}
						else if(attributesCA[a].attributeName.equals("REPRESENTATIVE TYPE") && attributesCN[n].attributeName.equals("REPRESENTATIVE TYPE"))
						{
							if(attributesCA[a].attributeValue && !attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue) && (capContactArray[c].getPeople().getContactType().equals("Individual") || capContactArray[c].getPeople().getContactType().equals("Applicant")))
							{
								result+=aa.messageResources.getLocalMessage("message.amend.partners") + " " + fullName + " " +aa.messageResources.getLocalMessage("message.keywords.from") + " " + aa.bizDomain.getBizDomainByValue("Representative Type",attributesCN[n].attributeValue,"ar_AE").getOutput().getDispBizdomainValue() + " " +aa.messageResources.getLocalMessage("message.keywords.to") + " " + aa.bizDomain.getBizDomainByValue("Representative Type",attributesCA[a].attributeValue,"ar_AE").getOutput().getDispBizdomainValue() + "\n";
							}
							else if(attributesCA[a].attributeValue && !attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue) && !capContactArray[c].getPeople().getContactType().equals("Individual"))
							{
								result+=aa.messageResources.getLocalMessage("message.amend.partners") + " " + capContactArray[c].getPeople().getBusinessName() + " " + capContactArray[c].getPeople().getTradeName() + " " +aa.messageResources.getLocalMessage("message.keywords.from") + " " + aa.bizDomain.getBizDomainByValue("Representative Type",attributesCN[n].attributeValue,"ar_AE").getOutput().getDispBizdomainValue() + " " +aa.messageResources.getLocalMessage("message.keywords.to") + " " + aa.bizDomain.getBizDomainByValue("Representative Type",attributesCA[a].attributeValue,"ar_AE").getOutput().getDispBizdomainValue() + "\n";
							}						
						}
					}
				}
			}
		}
		if(!found)
		{
			for(x in capContactArray[c].getPeople().getAttributes().toArray())
			{
				if(capContactArray[c].getPeople().getAttributes().toArray()[x].attributeName.equals("REPRESENTATIVE TYPE"))
				{
					repType = capContactArray[c].getPeople().getAttributes().toArray()[x].attributeValue;
				}
				if(capContactArray[c].getPeople().getAttributes().toArray()[x].attributeName.equals("SHARE PERCENTAGE"))
				{
					repPercent = capContactArray[c].getPeople().getAttributes().toArray()[x].attributeValue;
				}							
			}
			if(repType)
			{
				if(repType.equals("Manager"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.manager")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + fullName + "\n";
				}
				else if(repType.equals("Heirs Representative"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.heirs")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + fullName + "\n";
				}
				else if(repType.equals("Commissioner to Sign"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.manager")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + fullName + "\n";			
				}
				else if(repType.equals("Sponsor"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.sponsor")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + fullName + "\n";
				}
				else if(capContactArray[c].getPeople().getContactType && capContactArray[c].getPeople().getContactType().equals("Individual"))
				{
					result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + fullName + " " + " (" + repPercent + "%)\n";
				}
				else if(capContactArray[c].getPeople().getContactType && capContactArray[c].getPeople().getContactType().equals("Applicant"))
				{
					result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + fullName + "\n";
				}
				else
				{
					result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + capContactArray[c].getPeople().getBusinessName() + " " + capContactArray[c].getPeople().getTradeName() + "\n";
				}
			}
			else if(capContactArray[c].getPeople().getContactType && (capContactArray[c].getPeople().getContactType().equals("Individual") || capContactArray[c].getPeople().getContactType().equals("Applicant")))
			{
				result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + fullName + "\n";
			}
			else
			{
				result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.added") + " " + capContactArray[c].getPeople().getBusinessName() + " " + capContactArray[c].getPeople().getTradeName() + "\n";
			}
		}
	}
	for(p in parentCapContactArray)
	{
	
		firstName = parentCapContactArray[p].getPeople().getFirstName(); 
		secondName = parentCapContactArray[p].getPeople().getFullName();
		middleName = parentCapContactArray[p].getPeople().getMiddleName();
		lastName = parentCapContactArray[p].getPeople().getLastName();
		if (firstName == null)  firstName = ""; else firstName = firstName + " ";
		if (secondName == null)  secondName = ""; else secondName = secondName + " ";
		if (middleName == null)  middleName = ""; else middleName = middleName + " ";
		if(lastName == null) lastName = "";
		
		fullName = firstName + secondName + middleName + lastName;
		
		if (parentCapContactArray[p].getPeople().getContactType().equals("Applicant"))
		{
			continue;
		}
		found = false;
		for (c in capContactArray)
		{
			if(parentCapContactArray[p].getCapContactModel().getRefContactNumber().equals(capContactArray[c].getCapContactModel().getRefContactNumber()))
			{
				found = true;
			}
		}
		if(!found)
		{
			for(x in parentCapContactArray[p].getPeople().getAttributes().toArray())
			{
				if(parentCapContactArray[p].getPeople().getAttributes().toArray()[x].attributeName.equals("REPRESENTATIVE TYPE"))
				{
					repType = parentCapContactArray[p].getPeople().getAttributes().toArray()[x].attributeValue;
					if (!repType)
					{
						repType = "None";
					}
				}				
			}
			if(repType)
			{
				if(repType && repType.equals("Manager"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.manager")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " " + fullName + "\n";
				}
				else if(repType && repType.equals("Heirs Representative"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.heirs")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " " + fullName + "\n";
				}
				else if(repType && repType.equals("Commissioner to Sign"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.manager")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " " + fullName + "\n";			
				}
				else if(repType && repType.equals("Sponsor"))
				{
					result+=aa.messageResources.getLocalMessage("message.amend.sponsor")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " "+ fullName + "\n";
				}
				else if(parentCapContactArray[p].getPeople().getContactType && (parentCapContactArray[p].getPeople().getContactType().equals("Individual") || parentCapContactArray[p].getPeople().getContactType().equals("Applicant")))
				{
					result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " " + fullName + "\n";
				}
				else
				{
					result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " " + parentCapContactArray[p].getPeople().getBusinessName() + " " + parentCapContactArray[p].getPeople().getTradeName() + "\n";
				}
			}
			else if(parentCapContactArray[p].getPeople().getContactType && (parentCapContactArray[p].getPeople().getContactType().equals("Individual") || parentCapContactArray[p].getPeople().getContactType().equals("Applicant")))
			{
				result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " " + fullName + "\n";
			}
			else
			{
				result+= aa.messageResources.getLocalMessage("message.amend.partners")+ " " + aa.messageResources.getLocalMessage("message.keywords.removed") + " " + parentCapContactArray[p].getPeople().getBusinessName() + " " + parentCapContactArray[p].getPeople().getTradeName() + "\n";
			}	
		}
	}
return result;
}
function getLastAddressAmendment(customId) {
	//assumes only one address on each CAP

	var result = "";
	var capId = aa.cap.getCapID(customId).getOutput();
	var parentCapId = getParent(capId);
	var addressCA = aa.address.getAddressWithAttributeByCapId(capId);
	var addressCN = aa.address.getAddressWithAttributeByCapId(parentCapId);

	if(!addressCA.getSuccess()) {
		logDebug("WARNING retrieving addresses for capId : " + capId.getCapID() + "  " + addressCA.getErrorMessage());
		return false;
	} else {
		addressCA = addressCA.getOutput();
	}

	if(!addressCN.getSuccess()) {
		logDebug("WARNING retrieving addresses for capId : " + parentCapId.getCapID() + "  " + addressCA.getErrorMessage());
		return false;
	} else {
		addressCN = addressCN.getOutput();
	}

	if(addressCN.length == 1 && addressCA.length == 1) {
		if(addressCN[0].getRefAddressId() && addressCN[0].getRefAddressId().equals(addressCA[0].getRefAddressId())) {
			logDebug("Same address. Checking for template data delta.");
			var itr = addressCN[0].getAttributes().iterator();
			while(itr.hasNext()) {
				var a = itr.next();
				oiginalAttValue = a.getB1AttributeValue();
				if(oiginalAttValue == null) {
					oiginalAttValue = "";
				}
				attValue = getB1AttributeValue(addressCA[0].getAttributes(), a.getB1AttributeName());
				if(attValue == null) {
					attValue = "";
				}
				if(!attValue.equals(oiginalAttValue)) {
					result += aa.messageResources.getLocalMessage("message.amend.location") + " " + a.getB1AttributeName() + " " + aa.messageResources.getLocalMessage("message.keywords.from") + " " + oiginalAttValue + " " + aa.messageResources.getLocalMessage("message.keywords.to") + " " + attValue + "\n";
				}
			}
		} else {
			
			
			var cnCity = addressCN[0].getCity();
			if(!cnCity)
				cnCity = "";
			else
			cnCity = " " + cnCity;
			
			var cnAddressLine1 = addressCN[0].getAddressLine1(); 
			if(!cnAddressLine1)
				cnAddressLine1 = "";
			else
			cnAddressLine1 = " " + cnAddressLine1;
			
			var cnAddressLine2 = addressCN[0].getAddressLine2();
			if(!cnAddressLine2)
				cnAddressLine2 = "";
			else
			cnAddressLine2 = " " + cnAddressLine2;
			
			var cnBuildingName = addressCN[0].getNeighborhood();
			if(!cnBuildingName)
				cnBuildingName = "";
			else
			cnBuildingName = " " + cnBuildingName;
			
			var cnBuildingOwner = addressCN[0].getSecondaryRoad();
			if(!cnBuildingOwner)
				cnBuildingOwner = "";
			else
			cnBuildingOwner = " " + cnBuildingOwner;
			
			
			
			
			
			var caCity = addressCA[0].getCity();
			if(!caCity)
				caCity = "";
			else
			caCity = " " + caCity;
			
			var caAddressLine1 = addressCA[0].getAddressLine1(); 
			if(!caAddressLine1)
				caAddressLine1 = "";
			else
			caAddressLine1 = " " + caAddressLine1;
			
			var caAddressLine2 = addressCA[0].getAddressLine2();
			if(!caAddressLine2)
				caAddressLine2 = "";
			else
			caAddressLine2 = " " + caAddressLine2;
			
			
			var caBuildingName = addressCA[0].getNeighborhood();
			if(!caBuildingName)
				caBuildingName = "";
			else
			caBuildingName = " " + caBuildingName;
			
			var caBuildingOwner = addressCA[0].getSecondaryRoad();
			if(!caBuildingOwner)
				caBuildingOwner = "";
			else
			caBuildingOwner = " " + caBuildingOwner;
			
			if(addressCA[0].getRefAddressId())
				result += aa.messageResources.getLocalMessage("message.amend.location") + " " + aa.messageResources.getLocalMessage("message.keywords.from") + cnCity + cnAddressLine1 + cnAddressLine2 + cnBuildingName + cnBuildingOwner + " " + aa.messageResources.getLocalMessage("message.keywords.to") + caCity + caAddressLine1 + caAddressLine2 +  caBuildingName  + caBuildingName + caBuildingOwner + "\n";
		}
	} else {
		logDebug("CAPs must have exactly one address. Check address data.");
		return false;
	}

	return result;

}

function taskAssignedDate(wfstr) // optional process name, capId
	{

	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

	var useProcess = false;
	var processName = "";
	if (arguments.length > 1 && arguments[1] != null)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + wfObj.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			return ""+(fTask.getAssignmentDate().getMonth())+"/"+fTask.getAssignmentDate().getDayOfMonth()+"/"+(parseInt(fTask.getAssignmentDate().getYear()));
		}
	}

function zeroPad(num,count)
{
var numZeropad = num + '';
while(numZeropad.length < count) {

numZeropad = "0" + numZeropad;
}
return numZeropad;
}
//Functions for ApplicationSubmitBefore//////////////////////////////////////////////////////////////


function allInspectionsComplete(itemCap)
{
	var inspResultObj = aa.inspection.getInspections(itemCap);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		for (xx in inspList)
		   if (inspList[xx].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
			return false;
		}
	return true;
}
function appHasCondition(pType,pStatus,pDesc,pImpact,itemCAP)
	{
	// Checks to see if conditions have been added to CAP
	// 06SSP-00223
	//

	if (pType==null)
		var condResult = aa.capCondition.getCapConditions(itemCAP);
	else
		var condResult = aa.capCondition.getCapConditions(itemCAP,pType);

	if (condResult.getSuccess())
		var capConds = condResult.getOutput();
	else
		{
		logDebug("**WARNING: getting cap conditions: " + condResult.getErrorMessage());
		return false;
		}

	var cStatus;
	var cDesc;
	var cImpact;

	for (cc in capConds)
		{
		var thisCond = capConds[cc];
		var cStatus = thisCond.getConditionStatus();
		var cDesc = thisCond.getConditionDescription();
		var cImpact = thisCond.getImpactCode();
		var cType = thisCond.getConditionType();
		if (cStatus==null)
			cStatus = " ";
		if (cDesc==null)
			cDesc = " ";
		if (cImpact==null)
			cImpact = " ";
		//Look for matching condition

		if ( (pStatus==null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
			return true; //matching condition found
		}
	return false; //no matching condition found
	}
	
function condMatchObj()	
	{
	this.objType = null;
	this.contactObj = null;
	this.addressObj = null;
	this.licenseObj = null;
	this.parcelObj = null;
	this.status = null;
	this.type = null;
	this.impact = null;
	this.description = null;
	this.comment = null;
	}
function convertNullToEmptyString(value) {
  if(value == null)
    return "";

  return value;
}
function duplicateActivityCheck(licCap)
{
	var myActivities = loadASITable("COMMERCIAL ACTIVITIES", licCap);
	var existingActArr = new Array();
	for (act in myActivities) 
	{
		if(existingActArr && existingActArr.length >0)
		{
			for(x in existingActArr)
			{
				if(existingActArr[x].equals(myActivities[act]["Activity ID"].fieldValue))
				{
					return true;
				}
			}
		}
		existingActArr.push(myActivities[act]["Activity ID"].fieldValue);
	}
	return false;
}

function feeBalanceAll(itemCap)
	{
	// Searches payment fee items and returns the unpaid balance of a CAP
	var amtFee = 0;
	var amtPaid = 0;
	var feeSch;

	if (arguments.length == 2) feeSch = arguments[1];

	var feeResult=aa.fee.getFeeItems(itemCap);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
			{
			amtFee+=feeObjArr[ff].getFee();
			var pfResult = aa.finance.getPaymentFeeItems(itemCap, null);
			if (pfResult.getSuccess())
				{
				var pfObj = pfResult.getOutput();
				for (ij in pfObj)
					if (feeObjArr[ff].getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
						amtPaid+=pfObj[ij].getFeeAllocation()
				}
			}
	return amtFee - amtPaid;
	}
function getAppIdByASI(ASIName,ASIValue,ats,thisParent)
	//
	// returns the cap Id string of an application based on App-Specific Info and applicationtype.  Returns first result only!
	// added a parentCap to ignore
	{
	var ata = ats.split("/");
	if (ata.length != 4)
		logDebug("**ERROR: getAppIdByASI in appMatch.  The following Application Type String is incorrectly formatted: " + ats);

        var longCAP = thisParent.toString();

	var getCapResult = aa.cap.getCapIDsByAppSpecificInfoField(ASIName,ASIValue);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()) ; return null }
		

	for (aps in apsArray)
		{
		myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();
		myAppTypeString = myCap.getCapType().toString();
		myAppTypeArray = myAppTypeString.split("/");

		isMatch = true;
		for (xx in ata)
			if (!ata[xx].equals(myAppTypeArray[xx]) && !ata[xx].equals("*"))
				isMatch = false;
		
		if (isMatch && !longCAP.equals(apsArray[aps].getCapID().toString()))
			{
			logDebug("getAppIdByName(" + ASIName + "," + ASIValue + "," + ats + ") Returns " + apsArray[aps].getCapID().toString()); 
			return apsArray[aps].getCapID().toString()
			}
		}
	}
function getAppSpecific(itemName)  // optional: itemCap
{
	var updated = false;
	var i=0;
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args
   	
	if (useAppSpecificGroupName)
	{
		if (itemName.indexOf(".") < 0)
			{ logDebug("**WARNING: editAppSpecific requires group name prefix when useAppSpecificGroupName is true") ; return false }
		
		
		var itemGroup = itemName.substr(0,itemName.indexOf("."));
		var itemName = itemName.substr(itemName.indexOf(".")+1);
	}
	
    var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
 	{
		var appspecObj = appSpecInfoResult.getOutput();
		
		if (itemName != "")
		{
			for (i in appspecObj)
				if( appspecObj[i].getCheckboxDesc() == itemName && (!useAppSpecificGroupName || appspecObj[i].getCheckboxType() == itemGroup) )
				{
					return appspecObj[i].getChecklistComment();
					break;
				}
		} // item name blank
	} 
	else
		{ logDebug( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage()) }
}

function getCapId()  {

    var s_id1 = aa.env.getValue("PermitId1");
    var s_id2 = aa.env.getValue("PermitId2");
    var s_id3 = aa.env.getValue("PermitId3");

    var s_capResult = aa.cap.getCapID(s_id1, s_id2, s_id3);
    if(s_capResult.getSuccess())
      return s_capResult.getOutput();
    else
    {
      logMessage("**ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
      return null;
    }
  }
  
	function getChildren(pCapType, pParentCapId) 
	{
	// Returns an array of children capId objects whose cap type matches pCapType parameter
	// Wildcard * may be used in pCapType, e.g. "Building/Commercial/*/*"
	// Optional 3rd parameter pChildCapIdSkip: capId of child to skip

	var retArray = new Array();
	if (pParentCapId!=null) //use cap in parameter 
		var vCapId = pParentCapId;
	else // use current cap
		var vCapId = capId;
		
	if (arguments.length>2)
		var childCapIdSkip = arguments[2];
	else
		var childCapIdSkip = null;
		
	var typeArray = pCapType.split("/");
	if (typeArray.length != 4)
		logDebug("**ERROR in childGetByCapType function parameter.  The following cap type parameter is incorrectly formatted: " + pCapType);
		
	var getCapResult = aa.cap.getChildByMasterID(vCapId);
	if (!getCapResult.getSuccess())
		{ logDebug("**WARNING: getChildren returned an error: " + getCapResult.getErrorMessage()); return null }
		
	var childArray = getCapResult.getOutput();
	if (!childArray.length)
		{ logDebug( "**WARNING: getChildren function found no children"); return null ; }

	var childCapId;
	var capTypeStr = "";
	var childTypeArray;
	var isMatch;
	for (xx in childArray)
		{
		childCapId = childArray[xx].getCapID();
		if (childCapIdSkip!=null && childCapIdSkip.getCustomID().equals(childCapId.getCustomID())) //skip over this child
			continue;

		capTypeStr = aa.cap.getCap(childCapId).getOutput().getCapType().toString();	// Convert cap type to string ("Building/A/B/C")
		childTypeArray = capTypeStr.split("/");
		isMatch = true;
		for (yy in childTypeArray) //looking for matching cap type
			{
			if (!typeArray[yy].equals(childTypeArray[yy]) && !typeArray[yy].equals("*"))
				{
				isMatch = false;
				continue;
				}
			}
		if (isMatch)
			retArray.push(childCapId);
		}
		
	logDebug("getChildren returned " + retArray.length + " capIds");
	return retArray;

	}


function getConditions(pType,pStatus,pDesc,pImpact) // optional capID
	{
	
	var resultArray = new Array();
	var lang= "ar_AE";
	
	if (arguments.length > 4)
		var itemCap = arguments[4]; // use cap ID specified in args
	else
		var itemCap = capId;

	////////////////////////////////////////
	// Check Records
	////////////////////////////////////////
	
	if (pType==null)
		var condResult = aa.capCondition.getCapConditions(itemCap);
	else
		var condResult = aa.capCondition.getCapConditions(itemCap,pType);
		
	if (condResult.getSuccess())
		var capConds = condResult.getOutput();
	else
		{ 
		var capConds = new Array();
		logDebug("**WARNING: getting cap conditions: " + condResult.getErrorMessage());
		}
	
	var cStatus;
	var cDesc;
	var cImpact;
	
	for (cc in capConds)
		{
		var thisCond = capConds[cc];
		var cStatus = thisCond.getConditionStatus();
		var cDesc = thisCond.getConditionDescription();
		var cImpact = thisCond.getImpactCode();
		var cType = thisCond.getConditionType();
		var cComment = thisCond.getConditionComment();
		
		if (cStatus==null)
			cStatus = " ";
		if (cDesc==null)
			cDesc = " ";
		if (cImpact==null)
			cImpact = " ";
		//Look for matching condition
		
		if ( (pStatus==null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
			{
			var r = new condMatchObj;
			r.objType = "Record";
			r.object = thisCond;
			r.status = cStatus;
			r.type = cType;
			r.impact = cImpact;
			r.description = cDesc;
			r.comment = cComment;

			var langCond = aa.condition.getCondition(thisCond, lang).getOutput();
			
			r.arObject = langCond;
			r.arDescription = langCond.getResConditionDescription();
			r.arComment = langCond.getResConditionComment();
			
			resultArray.push(r);
			}
		}
		
	////////////////////////////////////////
	// Check Address
	////////////////////////////////////////
	
	var addrResult = aa.address.getAddressByCapId(itemCap);
	if (!addrResult.getSuccess())
		{
		logDebug("**WARNING: getting CAP addresses: "+addrResult.getErrorMessage());
		var addrArray = new Array();
		}
	else
		{
		var addrArray = addrResult.getOutput();
		if (!addrArray) addrArray = new Array();
		}
		
	for (var thisAddr in addrArray)
		if (addrArray[thisAddr].getRefAddressId())
			{
			addCondResult = aa.addressCondition.getAddressConditions(addrArray[thisAddr].getRefAddressId())
			if (!addCondResult.getSuccess())
				{
				logDebug("**WARNING: getting Address Conditions : "+addCondResult.getErrorMessage());
				var addrCondArray = new Array();
				}
			else
				{
				var addrCondArray = addCondResult.getOutput();
				}
			
			for (var thisAddrCond in addrCondArray)
				{
				var thisCond = addrCondArray[thisAddrCond];
				var cType = thisCond.getConditionType();
				var cStatus = thisCond.getConditionStatus();
				var cDesc = thisCond.getConditionDescription();
				var cImpact = thisCond.getImpactCode();
				var cType = thisCond.getConditionType();
				var cComment = thisCond.getConditionComment();

				if (cType == null)
					cType = " ";
				if (cStatus==null)
					cStatus = " ";
				if (cDesc==null)
					cDesc = " ";
				if (cImpact==null)
					cImpact = " ";

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (pStatus==null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "Address";
					r.addressObj = addrArray[thisAddr];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					var langCond = aa.condition.getCondition(thisCond, lang).getOutput();

					r.arObject = langCond;
					r.arDescription = langCond.getResConditionDescription();
					r.arComment = langCond.getResConditionComment();
			
					resultArray.push(r);
					}
				}
			}
			
	////////////////////////////////////////
	// Check Parcel
	////////////////////////////////////////
	
	var parcResult = aa.parcel.getParcelDailyByCapID(itemCap,null);
	if (!parcResult.getSuccess())
		{
		logDebug("**WARNING: getting CAP addresses: "+ parcResult.getErrorMessage());
		var parcArray = new Array();
		}
	else
		{
		var parcArray = parcResult.getOutput();
		if (!parcArray) parcArray = new Array();
		}
		
	for (var thisParc in parcArray)
		if (parcArray[thisParc].getParcelNumber())
			{
			parcCondResult = aa.parcelCondition.getParcelConditions(parcArray[thisParc].getParcelNumber())
			if (!parcCondResult.getSuccess())
				{
				logDebug("**WARNING: getting Parcel Conditions : "+parcCondResult.getErrorMessage());
				var parcCondArray = new Array();
				}
			else
				{
				var parcCondArray = parcCondResult.getOutput();
				}
			
			for (var thisParcCond in parcCondArray)
				{
				var thisCond = parcCondArray[thisParcCond];
				var cType = thisCond.getConditionType();
				var cStatus = thisCond.getConditionStatus();
				var cDesc = thisCond.getConditionDescription();
				var cImpact = thisCond.getImpactCode();
				var cType = thisCond.getConditionType();
				var cComment = thisCond.getConditionComment();

				if (cType == null)
					cType = " ";
				if (cStatus==null)
					cStatus = " ";
				if (cDesc==null)
					cDesc = " ";
				if (cImpact==null)
					cImpact = " ";

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (pStatus==null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "Parcel";
					r.parcelObj = parcArray[thisParc];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					var langCond = aa.condition.getCondition(thisCond, lang).getOutput();

					r.arObject = langCond;
					r.arDescription = langCond.getResConditionDescription();
					r.arComment = langCond.getResConditionComment();
			
					resultArray.push(r);
					}
				}
			}

	////////////////////////////////////////
	// Check License
	////////////////////////////////////////
	
	var capLicenseResult = aa.licenseScript.getLicenseProf(itemCap);
	
	if (!capLicenseResult.getSuccess())
		{
		logDebug("**WARNING: getting CAP licenses: "+ capLicenseResult.getErrorMessage());
		var licArray = new Array();
		}
	else
		{
		var licArray = capLicenseResult.getOutput();
		if (!licArray) licArray = new Array();
		}
		
	for (var thisLic in licArray)
		if (licArray[thisLic].getLicenseProfessionalModel().getLicSeqNbr())
			{
			var licCondResult = aa.caeCondition.getCAEConditions(licArray[thisLic].getLicenseProfessionalModel().getLicSeqNbr());
			if (!licCondResult.getSuccess())
				{
				logDebug("**WARNING: getting license Conditions : "+licCondResult.getErrorMessage());
				var licCondArray = new Array();
				}
			else
				{
				var licCondArray = licCondResult.getOutput();
				}
			
			for (var thisLicCond in licCondArray)
				{
				var thisCond = licCondArray[thisLicCond];
				var cType = thisCond.getConditionType();
				var cStatus = thisCond.getConditionStatus();
				var cDesc = thisCond.getConditionDescription();
				var cImpact = thisCond.getImpactCode();
				var cType = thisCond.getConditionType();
				var cComment = thisCond.getConditionComment();

				if (cType == null)
					cType = " ";
				if (cStatus==null)
					cStatus = " ";
				if (cDesc==null)
					cDesc = " ";
				if (cImpact==null)
					cImpact = " ";

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (pStatus==null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "License";
					r.licenseObj = licArray[thisLic];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					var langCond = aa.condition.getCondition(thisCond, lang).getOutput();

					r.arObject = langCond;
					r.arDescription = langCond.getResConditionDescription();
					r.arComment = langCond.getResConditionComment();
			
					resultArray.push(r);
					}
				}
			}

	////////////////////////////////////////
	// Check Contacts
	////////////////////////////////////////
	
	
	var capContactResult = aa.people.getCapContactByCapID(itemCap);

	if (!capContactResult.getSuccess())
		{
		logDebug("**WARNING: getting CAP contact: "+ capContactResult.getErrorMessage());
		var conArray = new Array();
		}
	else
		{
		var conArray = capContactResult.getOutput();
		if (!conArray) conArray = new Array();
		}
		
	for (var thisCon in conArray)
		if (conArray[thisCon].getCapContactModel().getRefContactNumber())
			{
			var conCondResult = aa.commonCondition.getCommonConditions("CONTACT", conArray[thisCon].getCapContactModel().getRefContactNumber());

			if (!conCondResult.getSuccess())
				{
				logDebug("**WARNING: getting contact Conditions : "+licCondResult.getErrorMessage());
				var conCondArray = new Array();
				}
			else
				{
				var conCondArray = conCondResult.getOutput();
				}
			
			for (var thisConCond in conCondArray)
				{
				var thisCond = conCondArray[thisConCond];
				var cType = thisCond.getConditionType();
				var cStatus = thisCond.getConditionStatus();
				var cDesc = thisCond.getConditionDescription();
				var cImpact = thisCond.getImpactCode();
				var cType = thisCond.getConditionType();
				var cComment = thisCond.getConditionComment();

				if (cType == null)
					cType = " ";
				if (cStatus==null)
					cStatus = " ";
				if (cDesc==null)
					cDesc = " ";
				if (cImpact==null)
					cImpact = " ";

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (pStatus==null || pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "Contact";
					r.contactObj = conArray[thisCon];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					var langCond = aa.condition.getCondition(thisCond, lang).getOutput();

					r.arObject = langCond;
					r.arDescription = langCond.getResConditionDescription();
					r.arComment = langCond.getResConditionComment();
			
					resultArray.push(r);
					}
				}
			}


		return resultArray;
	}
	
function getContactArrayBefore(clist)
	{
	// Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
	// optional capid

	var cArray = new Array();

	capContactArray = clist.toArray();

	for (yy in capContactArray)
			{
			logDebug("contactclass : " + capContactArray[yy].getClass());
			var aArray = new Array();
			aArray["lastName"] = capContactArray[yy].getPeople().lastName;
			aArray["firstName"] = capContactArray[yy].getPeople().firstName;
			aArray["businessName"] = capContactArray[yy].getPeople().businessName;
			aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
			aArray["contactType"] =capContactArray[yy].getPeople().contactType;
			aArray["relation"] = capContactArray[yy].getPeople().relation;
			aArray["phone1"] = capContactArray[yy].getPeople().phone1;
			aArray["phone2"] = capContactArray[yy].getPeople().phone2;
			aArray["email"] = capContactArray[yy].getPeople().email;
			aArray["addressLine1"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
			aArray["addressLine2"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
			aArray["addressLine3"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine3();
			aArray["city"] = capContactArray[yy].getPeople().getCompactAddress().getCity();
			aArray["state"] = capContactArray[yy].getPeople().getCompactAddress().getState();
			aArray["zip"] = capContactArray[yy].getPeople().getCompactAddress().getZip();
			aArray["fax"] = capContactArray[yy].getPeople().fax;
			aArray["businessName2"] = capContactArray[yy].getPeople().getTradeName();
			aArray["country"] = capContactArray[yy].getPeople().getCompactAddress().getCountry();
			aArray["fullName"] = capContactArray[yy].getPeople().getFullName;
			aArray["middleName"] = capContactArray[yy].getPeople().getMiddleName();
			aArray["salutation"] = capContactArray[yy].getPeople().getSalutation();
			aArray["FEIN"] = capContactArray[yy].getPeople().getFein();


			var pa = capContactArray[yy].getPeople().getAttributes().toArray();
	                for (xx1 in pa)
	                        {
            				aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
            				logDebug("attribute " + pa[xx1].attributeName + " value: " + pa[xx1].attributeValue);
						    }
			cArray.push(aArray);
			}

	return cArray;
	}
function getDepartmentName(username)
	{
	var suo = aa.person.getUser(username).getOutput(); 
	var dpt = aa.people.getDepartmentList(null).getOutput();
	for (var thisdpt in dpt)
	  	{
	  	var m = dpt[thisdpt]
	  	var  n = m.getServiceProviderCode() + "/" + m.getAgencyCode() + "/" + m.getBureauCode() + "/" + m.getDivisionCode() + "/" + m.getSectionCode() + "/" + m.getGroupCode() + "/" + m.getOfficeCode() 
	  
	  	if (n.equals(suo.deptOfUser)) 
	  	return(m.getDeptName())
  		}
  	}

function getLicenseProfessional(itemcapId)
{
	capLicenseArr = null;
	var s_result = aa.licenseProfessional.getLicenseProf(itemcapId);
	if(s_result.getSuccess())
	{
		capLicenseArr = s_result.getOutput();
		if (capLicenseArr == null || capLicenseArr.length == 0)
		{
			aa.print("WARNING: no licensed professionals on this CAP:" + itemcapId);
			capLicenseArr = null;
		}
	}
	else
	{
		aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
		capLicenseArr = null;
	}
	return capLicenseArr;
}

function getParent() 
	{
	// returns the capId object of the parent.  Assumes only one parent!
	//
	getCapResult = aa.cap.getProjectParents(capId,1);
	if (getCapResult.getSuccess())
		{
		parentArray = getCapResult.getOutput();
		if (parentArray.length)
			return parentArray[0].getCapID();
		else
			{
			logDebug( "**WARNING: GetParent found no project parent for this application");
			return false;
			}
		}
	else
		{ 
		logDebug( "**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
		return false;
		}
	}
	
function getRefLicenseProf(refstlic)
	{
	var refLicObj = null;
	var refLicenseResult = aa.licenseScript.getRefLicensesProfByLicNbr(aa.getServiceProviderCode(),refstlic);
	if (!refLicenseResult.getSuccess())
		{ logDebug("**ERROR retrieving Ref Lic Profs : " + refLicenseResult.getErrorMessage()); return false; }
	else
		{
		var newLicArray = refLicenseResult.getOutput();
		if (!newLicArray) return null;
		for (var thisLic in newLicArray)
			if (refstlic && newLicArray[thisLic] && refstlic.toUpperCase().equals(newLicArray[thisLic].getStateLicense().toUpperCase()))
				refLicObj = newLicArray[thisLic];
		}

	return refLicObj;
	}
	
function getf(thisCap) {
    // Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
    // -- for Before scripts!
    
    var cArray = new Array();

    var capContactResult = aa.people.getCapContactByCapID(thisCap);
    if (capContactResult.getSuccess()) {
        var capContactArray = capContactResult.getOutput();
        for (yy in capContactArray) {
            var aArray = new Array();
            aArray["lastName"] = capContactArray[yy].getPeople().lastName;
            aArray["firstName"] = capContactArray[yy].getPeople().firstName;
            aArray["businessName"] = capContactArray[yy].getPeople().businessName;
            aArray["contactSeqNumber"] = capContactArray[yy].getPeople().contactSeqNumber;
            aArray["contactType"] = capContactArray[yy].getPeople().contactType;
            aArray["relation"] = capContactArray[yy].getPeople().relation;
            aArray["phone1"] = capContactArray[yy].getPeople().phone1;
            aArray["phone2"] = capContactArray[yy].getPeople().phone2;


            var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
            for (xx1 in pa)
                aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
            cArray.push(aArray);
        }
    }
    return cArray;
}

function invalidBranchNumbers() 
{
	var invalidBranchNumbers = "";
	
	var gm = aa.env.getValue("AppSpecificTableGroupModel");
	if (gm && !gm.getTablesMap) {
		return;
	}

	var ta = gm.getTablesMap().values();
	var tai = ta.iterator();

	while (tai.hasNext()) {
		var tsm = tai.next();

		if (tsm.rowIndex.isEmpty())
			continue; // empty table

		var tsmfldi = tsm.getTableField().iterator();
		var tsmcoli = tsm.getColumns().iterator();

		while (tsmfldi.hasNext()) // cycle through fields
		{
			if (!tsmcoli.hasNext()) // cycle through columns
			{
				var tsmcoli = tsm.getColumns().iterator();
			}
			var tcol = tsmcoli.next();
			var tval = tsmfldi.next();
			if (tcol.getColumnName() == "Branch Number")
			{
				logDebug("[invalidBranchNumbers] Validate Branch Number = " + tval);
				
				// check whether the branch number is valid or not
				// 1. if it is in available branches
				// 2. or if it is same as the license number of one of the
				// selected contacts
				if (!isBranchNumberValid(tval))
				{
					if (invalidBranchNumbers != "")
					{
						invalidBranchNumbers += "/";
					}
					invalidBranchNumbers += tval;
				}
			}
		}
	}

	return invalidBranchNumbers;
}

function isAnAvailableBranch(branchNumber)
{
	if (AInfo && AInfo["Available Branches"]) 
	{
		var availableBranches = AInfo["Available Branches"];
		logDebug("[invalidBranchNumbers] Available Branches=" + availableBranches);
		
		var availableBrancheArray = availableBranches.split("\r\n");
		for (i in availableBrancheArray)
		{
			if (availableBrancheArray[i].trim().toUpperCase().equals(branchNumber.trim().toUpperCase()))
			{
				logDebug("[invalidBranchNumbers] An Available Branch matches:" + branchNumber);
				return true;
			}
		}
	}

	logDebug("[invalidBranchNumbers] No Available Branch matches:" + branchNumber);
	return false;
}

function isBranchNumberValid(branchNumber)
{
	return isSameAsContactLicenseNumber(branchNumber) || isAnAvailableBranch(branchNumber);
}

function isSameAsContactLicenseNumber(branchNumber)
{
	var contactList = contactArray();
	if (contactList && typeof(contactList) == "object")
	{
		for (thisRow in contactList) 
		{
			// "FEIN" is displayed as "License Number" of contact
			if (contactList[thisRow]["FEIN"] && contactList[thisRow]["FEIN"].trim().toUpperCase().equals(branchNumber.trim().toUpperCase()))				
			{
				logDebug("[invalidBranchNumbers] A contact license number matches:" + branchNumber);
				return true;
			}
		}
	}

	logDebug("[invalidBranchNumbers] No contact license number matches:" + branchNumber);
	return false;
}

function isReconcileAlreadyOpen(checkFromDate,checkToDate,userBranch)
	{

	//aa.print(checkFromDate);
	var checkFromDate = new Date(checkFromDate).getTime()+1;  
	//aa.print(checkFromDate);
	//aa.print(checkToDate);
	var checkToDate = new Date(checkToDate).getTime()+1;
	//aa.print(checkToDate);
	
	fromDt = aa.date.parseDate(dateAdd(null,-365)); // look 365 days back for a reconcilation record - updated on 19 Dec 2011
	toDt = aa.date.parseDate(dateAdd(null,1));
	emptyGISArray = new Array();

	var emptyCm = aa.cap.getCapModel().getOutput();
	var emptyCt = emptyCm.getCapType();
	emptyCt.setGroup("Financial");
	emptyCt.setType("Reconcile");
	emptyCt.setSubType("Supervisor");
	emptyCm.setCapType(emptyCt);

	todayCaps = aa.cap.getCapListByCollection(emptyCm, null, null, fromDt,toDt,null, emptyGISArray).getOutput();

	if (todayCaps)
		for (var y in todayCaps)
			if (aa.cap.getCap(todayCaps[y].getCapID()).getOutput().getCapStatus() != "Void")
					{
					recCapId = todayCaps[y].getCapID();
					recCap = aa.cap.getCap(recCapId).getOutput();
					recDet = aa.cap.getCapDetail(recCapId).getOutput();

					var fDate = null; var tDate = null;
					var fromDate = recDet.getAsgnDate();
					var toDate = recDet.getAppearanceDate();
					if (fromDate) { fDate = new Date(); fDate.setTime(fromDate.getEpochMilliseconds()); }
					if (toDate) { tDate = new Date(); tDate.setTime(toDate.getTime()); }

					
					if (fDate && tDate && (checkFromDate >= fDate && checkFromDate <= tDate) || (checkToDate >= fDate && checkToDate <= tDate))
						{
						if (userBranch.equals(getAppSpecific("Branch",recCapId)))
							{
							//aa.print(fDate) ; aa.print(fDate.getTime()) ; aa.print(tDate) ; aa.print(tDate.getTime()); aa.print ("==============="); 
							return true;
							}
						}
					}
	return false;
	}
	
function isScheduledAfterDate(inspType,dateToCheck,itemCap)
	{
	var found = false;
	var inspResultObj = aa.inspection.getInspections(itemCap);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(inspType).equals(inspList[xx].getInspectionType()))
				{
                                sDate = convertDate(inspList[xx].getScheduledDate());
				tDate = new Date(dateToCheck);
                                if (sDate.getTime() > tDate.getTime())
				     found = true;
                                }
		}
	return found;
	}
	
function issueDateLessThanOneYearFromNow(capId)
{                
        aa.debug("Michael1129","issueDateLessThanOneYearFromNow");
		//var today = aa.util.formatDate(aa.util.now(),'MM/dd/yyyy');
	        var isIssueDateInDiffYear = false;
		var tasks = aa.workflow.getTasks(capId);
		aa.debug("Michael1129,capId==",capId);
		if (tasks.getSuccess())
		{
			var taskArray = tasks.getOutput();
			
			if (taskArray.length > 0)
			{				  
					for (xx in taskArray)
					{
						task = taskArray[xx];
						
						var taskDesc = task.getTaskDescription();
                                                var status = task.getDisposition();
                                                   aa.debug("Michael1129,status ==",status );
						if(taskDesc == "License Issuance" && status=="Complete" )
						{
						  var temDate = task.getStatusDate();
						  aa.debug("Michael1129,temDate==",temDate );
						  
				
									//var apIssueDate = aa.util.formatDate(temDate,'MM/dd/yyyy');
									//aa.debug("Michael1129,apIssueDate==",apIssueDate );
								     var temYear = temDate.getYear()+1900;
									var sysYear = sysDate.getYear();
									aa.debug("temYear==",temYear);
									aa.debug("sysYear==",sysYear);
									if( sysYear - temYear ==0)
									{
										isIssueDateInDiffYear = true;
								         }						 
                                                    
						}
					}
			}
		}
		
		return isIssueDateInDiffYear ;
}


function licenseObject(licnumber,itemCap)
{

    this.refProf = null; 	// licenseScriptModel (reference licensed professional)
    this.b1Exp = null; 	// b1Expiration record (renewal status on application)
    this.b1ExpDate = null;
    this.b1ExpCode = null;
    this.b1Status = null;
    this.refExpDate = null;
    this.licNum = licnumber; // License Number


    // Load the reference License Professional if we're linking the two
    if (licnumber) // we're linking
    {
        var newLic = getRefLicenseProf(licnumber)
        if (newLic) {
            this.refProf = newLic;
            tmpDate = newLic.getLicenseExpirationDate();
            if (tmpDate)
                this.refExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear();
            logDebug("Loaded reference license professional with Expiration of " + this.refExpDate);
        }
    }

    // Load the renewal info (B1 Expiration)

    b1ExpResult = aa.expiration.getLicensesByCapID(itemCap)
    if (b1ExpResult.getSuccess()) {
        this.b1Exp = b1ExpResult.getOutput();
        tmpDate = this.b1Exp.getExpDate();
        if (tmpDate)
            this.b1ExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear();
        this.b1Status = this.b1Exp.getExpStatus();
        logDebug("Found renewal record of status : " + this.b1Status + ", Expires on " + this.b1ExpDate);
    }
    else
    { logDebug("**ERROR: Getting B1Expiration Object for Cap.  Reason is: " + b1ExpResult.getErrorType() + ":" + gisObjResult.getErrorMessage()); return false }


    this.setExpiration = function(expDate)
    // Update expiration date
    {
        var expAADate = aa.date.parseDate(expDate);

        if (this.refProf) {
            this.refProf.setLicenseExpirationDate(expAADate);
            aa.licenseScript.editRefLicenseProf(this.refProf);
            logDebug("Updated reference license expiration to " + expDate);
        }

        if (this.b1Exp) {
            this.b1Exp.setExpDate(expAADate);
            aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
            logDebug("Updated renewal to " + expDate);
        }
    }

    this.setIssued = function(expDate)
    // Update Issued date
    {
        var expAADate = aa.date.parseDate(expDate);

        if (this.refProf) {
            this.refProf.setLicenseIssueDate(expAADate);
            aa.licenseScript.editRefLicenseProf(this.refProf);
            logDebug("Updated reference license issued to " + expDate);
        }

    }
    this.setLastRenewal = function(expDate)
    // Update expiration date
    {
        var expAADate = aa.date.parseDate(expDate)

        if (this.refProf) {
            this.refProf.setLicenseLastRenewalDate(expAADate);
            aa.licenseScript.editRefLicenseProf(this.refProf);
            logDebug("Updated reference license issued to " + expDate);
        }
    }

    this.setStatus = function(licStat)
    // Update expiration status
    {
        if (this.b1Exp) {
            this.b1Exp.setExpStatus(licStat);
            aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
            logDebug("Updated renewal to status " + licStat);
        }
    }

    this.getStatus = function()
    // Get Expiration Status
    {
        if (this.b1Exp) {
            return this.b1Exp.getExpStatus();
        }
    }

    this.getCode = function()
    // Get Expiration Status
    {
        if (this.b1Exp) {
            return this.b1Exp.getExpCode();
        }
    }
}	
function licenseStatusByName(licType,nameEnglish,nameArabic,statusCheck) {
  tnList = new Array();
  tnList = aa.licenseScript.getTradeNameList(nameEnglish,nameArabic).getOutput().toArray();

  if (tnList) {
          for (x in tnList) {
          if (tnList[x].getLicenseType() == licType) {
          var licCap = aa.cap.getCapID(tnList[x].getStateLicense()).getOutput();
          var capStatus = aa.cap.getCap(licCap).getOutput().getCapStatus();
          if (capStatus == statusCheck) return true;
          else return false;
          }
          }   
  }  
}

function loadASITablesBeforeAMO() {
  //
  // Loads App Specific tables into their own array of arrays.  Creates global array objects
 //
 //
 var gm =  aa.env.getValue("AppSpecificTableGroupModel");
 var n = 0;
 var size = gm.size();
 while (n < size)
   {
   var tsm = gm.get(n);
   n++;
   if (tsm.rowIndex.isEmpty()) continue;  // empty table
   var tempObject = new Array();
   var tempArray = new Array();
   var tn = tsm.getTableName();
    var numrows = 0;
   tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');
   if (!isNaN(tn.substring(0,1))) tn = "TBL" + tn  // prepend with TBL if it starts with a number
   if (!tsm.rowIndex.isEmpty())
    {
    var tsmfldi = tsm.getTableField().iterator();
    var tsmcoli = tsm.getColumns().iterator();
    var numrows = 1;
    while (tsmfldi.hasNext())  // cycle through fields
   {
   if (!tsmcoli.hasNext())  // cycle through columns
    {
    var tsmcoli = tsm.getColumns().iterator();
    tempArray.push(tempObject);  // end of record
    var tempObject = new Array();  // clear the temp obj
    numrows++;
    }
   var tcol = tsmcoli.next();
   var tval = tsmfldi.next();
   var readOnly = 'N';
   var fieldInfo = new asiTableValObj(tcol.getColumnName(), tval, readOnly);
   tempObject[tcol.getColumnName()] = fieldInfo;
   }
   tempArray.push(tempObject);  // end of record
  }
   var copyStr = "" + tn + " = tempArray";
   aa.print("ASI Table Array : " + tn + " (" + numrows + " Rows)");
          eval(copyStr);  // move to table name
   }
 }
 
 function loadTaskSpecific(thisArr) 
	{
 	// 
 	// Appends the Task Specific Info to App Specific Array
 	// If useTaskSpecificGroupName==true, appends wf process code.wftask. to TSI field label
	// Optional second parameter, cap ID to load from
	//
	
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		var wfObj = workflowResult.getOutput();
 	else
 		{ logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()) ; return false; }
 
 	for (i in wfObj)
 		{
 		var fTask = wfObj[i];
 		var stepnumber = fTask.getStepNumber();
 		var processID = fTask.getProcessID();
 		var TSIResult = aa.taskSpecificInfo.getTaskSpecificInfoByTask(itemCap, processID, stepnumber)
 		if (TSIResult.getSuccess())
 			{
 			var TSI = TSIResult.getOutput();
 			for (a1 in TSI)
  				{
  				if (useTaskSpecificGroupName)
  	  				thisArr[fTask.getProcessCode() + "." + fTask.getTaskDescription() + "." + TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
  	  			else
	  				thisArr[TSI[a1].getCheckboxDesc()] = TSI[a1].getChecklistComment();
				}
 			}
 		}
	}
	
function loadTasks(ltcapidstr)
	{
	if (typeof(ltcapidstr) == "string")
                {
		var ltresult = aa.cap.getCapID(ltcapidstr);
	 	if (ltresult.getSuccess())
  		 	ltCapId = ltresult.getOutput();
	  	else
  		  	{ logMessage("**ERROR: Failed to get cap ID: " + ltcapidstr + " error: " +  ltresult.getErrorMessage()); return false; }
                }
	else
		ltCapId = ltcapidstr;

  	var taskArr = new Array();

	var workflowResult = aa.workflow.getTasks(ltCapId);
	if (workflowResult.getSuccess())
		wfObj = workflowResult.getOutput();
	else
		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
		fTask = wfObj[i];
		var myTask = new Task();
		myTask.status = fTask.getDisposition();
		myTask.comment = fTask.getDispositionComment();
		myTask.process = fTask.getProcessCode();
                if (fTask.getStatusDate()) myTask.statusdate = "" + (fTask.getStatusDate().getMonth() + 1) + "/" + fTask.getStatusDate().getDate() + "/" + (fTask.getStatusDate().getYear() + 1900);
		myTask.processID = fTask.getProcessID();
		myTask.note = fTask.getDispositionNote();
		myTask.step = fTask.getStepNumber();
		myTask.active = fTask.getActiveFlag(); 
		taskArr[fTask.getTaskDescription()] = myTask;
		}
	return taskArr;
	}
	
function scheduleInspectDate(iType,DateToSched) // optional inspector ID.
// DQ - Added Optional 4th parameter inspTime Valid format is HH12:MIAM or AM (SR5110)
// DQ - Added Optional 5th parameter inspComm
	{
	var inspectorObj = null;
	var inspTime = null;
	var inspComm = "Scheduled via Script";
	if (arguments.length >= 3)
		if (arguments[2] != null)
			{
			var inspRes = aa.person.getUser(arguments[2]);
			if (inspRes.getSuccess())
				inspectorObj = inspRes.getOutput();
			}

        if (arguments.length >= 4)
            if(arguments[3] != null)
		        inspTime = arguments[3];

		if (arguments.length >= 5)
		    if(arguments[4] != null)
		        inspComm = arguments[4];

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(DateToSched), inspTime, iType, inspComm)

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + DateToSched);
	else
		logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}

function taskStatus(wfstr) // optional process name and capID
	{
	var useProcess = false;
	var processName = "";
	var itemCap = capId;
	if (arguments.length >= 2)
		{
		processName = arguments[1]; // subprocess
		if (processName) useProcess = true;
		}

	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args



	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + workflowResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			return fTask.getDisposition()
		}
	}

function tradeNameExistsAtAddress(emirate, island, city, primaryArea, secondaryArea, streetOrBlock, buildingType, unitType, buildingName, buildingOwnerName, buildingOrPieceNumber, unitSurfaceArea, primary, unitNumber, numberOfSections, sectionNumber)
{ 
   var address = aa.proxyInvoker.newInstance("com.accela.aa.aamain.address.AddressModel").getOutput();
   address.setServiceProviderCode(aa.getServiceProviderCode());
   address.setInspectionDistrict(emirate.toUpperCase());
   address.setInspectionDistrictPrefix(island.toUpperCase());
   address.setCity(city.toUpperCase());
   address.setAddressLine1(primaryArea.toUpperCase());
   address.setAddressLine2(secondaryArea.toUpperCase());
   address.setStreetName(streetOrBlock.toUpperCase());
   address.setNeighborhood(buildingName.toUpperCase()); 
   address.setCounty(buildingOwnerName.toUpperCase());
   address.setHouseFractionStart(buildingOrPieceNumber.toUpperCase());
   address.setUnitStart(unitNumber);
   address.setPrimaryFlag(primary);
   address.setUnitEnd(numberOfSections);
   address.setZip(sectionNumber);
   if(unitSurfaceArea != "")
      address.setDistance(parseFloat(unitSurfaceArea));

   var retObj = aa.address.getCapIdByAddress(address);
   var capIdArray = retObj.getOutput();
   if(capIdArray.length == 0)
   {
      return false;
   }

   for(i=0; i<capIdArray.length; i++)
   {
      var capType = aa.cap.getCapTypeModelByCapID(capIdArray[i]).getOutput();
      if(!capType.getType() == "Trade Name")
         continue;

      var addyArray = aa.address.getAddressByCapId(capIdArray[i]).getOutput();
      for(j=0; j<addyArray.length; j++)
      {
        var address = addyArray[j];
        // check that this is the same address
        if(emirate == address.getInspectionDistrict() && island == address.getInspectionDistrictPrefix() &&
           city == address.getCity() && primaryArea == address.getAddressLine1() &&
           secondaryArea == address.getAddressLine2() && streetOrBlock == address.getStreetName() &&
           buildingName == convertNullToEmptyString(address.getNeighborhood()) &&
           buildingOwnerName == convertNullToEmptyString(address.getCounty()) &&
           buildingOrPieceNumber == convertNullToEmptyString(address.getHouseNumberStart()) &&
           unitSurfaceArea == convertNullToEmptyString(address.getDistance()) &&
           unitNumber == convertNullToEmptyString(address.getUnitStart()) &&
           primary == convertNullToEmptyString(address.getPrimaryFlag()) &&
           numberOfSections == convertNullToEmptyString(address.getUnitEnd()) &&
           sectionNumber == convertNullToEmptyString(address.getZip()))
        {
           var buildingTypeMatch;
           var unitTypeMatch;
           var attributes = address.getAttributes().toArray();
           for(k=0; k<attributes.length; k++)
           {
             var attribute = attributes[k];
             attrValue = attribute.getB1AttributeValue();
             if(attrValue == null)
                attrValue = "";
             
             if("BUILDING TYPE" == attribute.getB1AttributeName() && buildingType == attrValue)
                 buildingTypeMatch = true;            
             else if("UNIT TYPE" == attribute.getB1AttributeName() && unitType == attrValue)
               unitTypeMatch = true;
           }

           if(buildingTypeMatch && unitTypeMatch)
           {
              return true;
           }
        }
      }
   }

   return false;
}

function validateContactListRelatedRecords()
{ 

  var errMessage = "";
  var contactListArray = contactArray();

  if(contactListArray.length == 0)
  {
        return "";
  }

  for (c in contactListArray)
  {
  	var licenseNum = contactListArray[c]["FEIN"];
  	var contactType = contactListArray[c]["contactType"];

  	if(contactType == "Local Company" && !validateRelatedRecords(licenseNum))
  	{
  			errMessage += licenseNum + ",";
  	}
  }
  
  if(errMessage != "")
  {
    errMessage = errMessage.substring(0,errMessage.length - 1);
    var objArray = new Array();
		objArray[0] = errMessage;
  	errMessage = aa.messageResources.getLocalMessage("error.custom.script.validateContactSalesTransFailed",objArray);
  }
  
  return errMessage;
}

function validateLPRelatedRecords()
{

	var errMessage = "";
 
  if(!validateRelatedRecords(CAELienseNumber))
  {
  		var objArray = new Array();
		  objArray[0] = CAELienseNumber;
  		errMessage += aa.messageResources.getLocalMessage("error.custom.script.validateLPSalesTransFailed", objArray);
  }
   aa.debug("Michael1129,errMessage==",errMessage);
  return errMessage;
}

function validateRelatedRecords(licenseNum)
{       

	var capId = aa.cap.getCapID(licenseNum.trim()).getOutput();
	var relatedRecords = aa.cap.getChildByMasterID(capId);
	var salesTransactionCount = 0;
	var isValidatedPassed = true;
	if (relatedRecords.getSuccess())
		{
			var childArray = relatedRecords.getOutput();
			if (childArray.length > 0)
			{
				  var childCapId;
				  var childCapType;
					for (xx in childArray)
					{
						childCapId = childArray[xx].getCapID();
						childCapType = childArray[xx].getCapType();
						
						if(childCapType.getGroup()=="Services"&& childCapType.getType()=="Advertising Permit" &&
						    childCapType.getSubType()=="Promotional Campaigns"&& childCapType.getCategory()=="Sales")
						{
						    aa.debug("Michael1129,childCapType.getGroup()==",childCapType.getGroup());
							aa.debug("Michael1129,childCapType.getType()==",childCapType.getType());
							aa.debug("Michael1129,childCapType.getSubType()==",childCapType.getSubType());
						   if(issueDateLessThanOneYearFromNow(childCapId))
						   {
							  salesTransactionCount ++;
						   }
						}
						
					}
					aa.debug("salesTransactionCount==",salesTransactionCount);

					if(salesTransactionCount > 1)
					{
						isValidatedPassed = false; 
					}
			}
			else
			{
				isValidatedPassed = true;
			}
		}
		else
		{
			isValidatedPassed = true;
		}
  aa.debug("Michael1129,isValidatedPassed==",isValidatedPassed);
	return isValidatedPassed;
}

function validateSalesTransCount()
{

	var currentUserGroup;
	var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
	if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
	var errMessage = "";
  
  if(currentUserGroup == "ServicesBackOffice" 
  || appTypeString != "Services/Advertising Permit/Promotional Campaigns/Sales")
  {
  	 return "";
  }
  
	errMessage += validateLPRelatedRecords();
	errMessage += validateContactListRelatedRecords();
	
	return errMessage;
}
//Functions for ApplicationSubmitAfter//////////////////////////////////////////////////////////////////////////////
function addTSI(itemCap, taskName, TSIGroup, TSICheckboxType, TSIDescription, TSIValue, TSIChckboxInd, TSITaskReqFlag) {
    var fTask;
    newTSI = aa.taskSpecificInfo.getTaskSpecificInfoScriptModel().getOutput().getTaskSpecificInfoModel();
    wfObj = aa.workflow.getTasks(itemCap).getOutput()
    for (i in wfObj) {
        fTask = wfObj[i];
        if (fTask.getTaskDescription().toUpperCase().equals(taskName.toUpperCase()))
            break;
    }
    if (!fTask) return null;
    newTSI.setActStatus(TSIGroup);
    newTSI.setAttributeValueReqFlag("Y");
    newTSI.setAuditDate(aa.util.now());
    newTSI.setAuditid(currentUserID);
    newTSI.setAuditStatus("A");
    newTSI.setBGroupDspOrder(10);
    newTSI.setCheckboxDesc(TSIDescription);
    newTSI.setCheckboxInd(TSIChckboxInd);
    newTSI.setCheckboxType(TSICheckboxType);
    newTSI.setChecklistComment(TSIValue);
    newTSI.setDisplayOrder("10");
    newTSI.setGroupCode(TSIGroup);
    newTSI.setPermitID1(itemCap.getID1());
    newTSI.setPermitID2(itemCap.getID2());
    newTSI.setPermitID3(itemCap.getID3());
    newTSI.setProcessID(fTask.getProcessID());
    newTSI.setServiceProviderCode(itemCap.getServiceProviderCode());
    newTSI.setStepNumber(fTask.getStepNumber());
    newTSI.setTaskStatusReqFlag(TSITaskReqFlag);

    tempArray = new Array(); tempArray.push(newTSI);

    TSIResult = aa.taskSpecificInfo.editTaskSpecInfos(tempArray);

    if (TSIResult.getSuccess()) {
        //aa.print("Successfully added TSI : " + TSIDescription);
        return newTSI
    }
    else {
        //aa.print("Couldn't add TSI: " + TSIResult.getErrorMessage());
        return false;
    }
}

function createAdvertisingPermitSearchEntries(itemCapId)
{
	createLicenseSearchEntries(itemCapId, 'ADVERTISINGPERMIT');	
}
function createChild(grp, typ, stype, cat, desc)
//
// creates the new application and returns the capID object
//
{
    var appCreateResult = aa.cap.createApp(grp, typ, stype, cat, desc);
    logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
    if (appCreateResult.getSuccess()) {
        var newId = appCreateResult.getOutput();
        logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");

        // create Detail Record
        capModel = aa.cap.newCapScriptModel().getOutput();
        capDetailModel = capModel.getCapModel().getCapDetailModel();
        capDetailModel.setCapID(newId);
        aa.cap.createCapDetail(capDetailModel);

        var newObj = aa.cap.getCap(newId).getOutput(); //Cap object
        var result = aa.cap.createAppHierarchy(capId, newId);
        if (result.getSuccess())
            logDebug("Child application successfully linked");
        else
            logDebug("Could not link applications");

        // Copy Parcels

        var capParcelResult = aa.parcel.getParcelandAttribute(capId, null);
        if (capParcelResult.getSuccess()) {
            var Parcels = capParcelResult.getOutput().toArray();
            for (zz in Parcels) {
                logDebug("adding parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
                var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
                newCapParcel.setParcelModel(Parcels[zz]);
                newCapParcel.setCapIDModel(newId);
                newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
                newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
                aa.parcel.createCapParcel(newCapParcel);
            }
        }

        // Copy Contacts
        capContactResult = aa.people.getCapContactByCapID(capId);
        if (capContactResult.getSuccess()) {
            Contacts = capContactResult.getOutput();
            for (yy in Contacts) {
                var newContact = Contacts[yy].getCapContactModel();
                newContact.setCapID(newId);
                aa.people.createCapContact(newContact);
                logDebug("added contact");
            }
        }

        // Copy Addresses
        capAddressResult = aa.address.getAddressByCapId(capId);
        if (capAddressResult.getSuccess()) {
            Address = capAddressResult.getOutput();
            for (yy in Address) {
                newAddress = Address[yy];
                newAddress.setCapID(newId);
                aa.address.createAddress(newAddress);
                logDebug("added address");
            }
        }

        return newId;
    }
    else {
        logDebug("**ERROR: adding child App: " + appCreateResult.getErrorMessage());
    }
}

function createContactAttribute(attrName, attrValue, attrType, attrReq, attrVCH) {
    newAttrSM = aa.licenseProfessional.getContactAttributeScriptModel().getOutput()
    newAttr = newAttrSM.getContactAttributeModel()

    newAttr.setAttributeLabel(attrName)
    newAttr.setAttributeName(attrName)
    newAttr.setAttributeValue(attrValue)
    newAttr.setAttributeValueDataType(attrType)
    newAttr.setAttributeValueReqFlag(attrReq)
    newAttr.setAuditDate(aa.util.now())
    newAttr.setAuditID("ADMIN")
    newAttr.setAuditStatus("A")
    newAttr.setCapID(capId);
    newAttr.setVchFlag(attrVCH);

    return newAttr;
}

function createNewCapContact(contData) {
    //  Get existing contact to use as a base
    //  This function will exit if there is not a contact to base on -- limitation in AA EMSE

    capContacts = aa.people.getCapContactByCapID(capId).getOutput()

    if (capContacts.length > 0) {
        baseContact = capContacts[0].getCapContactModel()
        basePeople = baseContact.getPeople()
        baseAttrList = basePeople.getAttributes()
    }
    else {
        logDebug("Can't create contacts.  At least one contact is required to exist on the CAP");
        return false;
    }

    //clear baseContact
    baseContact.sePreferredChannele(null);
    baseContact.setAddressLine1(null);
    baseContact.setAddressLine2(null);
    baseContact.setAddressLine3(null);
    baseContact.setBirthDate(null);
    baseContact.setBusName2(null);
    baseContact.setBusinessName(null);
    baseContact.setCity(null);
    baseContact.setContactOnSRChange(null);
    baseContact.setContactType(null);
    baseContact.setCountry(null);
    baseContact.setCountryCode(null);
    baseContact.setEmail(null);
    baseContact.setEndBirthDate(null);
    baseContact.setFirstName(null);
    baseContact.setFullName(null);
    baseContact.setGender(null);
    baseContact.setLastName(null);
    baseContact.setMiddleName(null);
    baseContact.setPeople(null);
    baseContact.setPersonType(null);
    baseContact.setPostOfficeBox(null);
    baseContact.setPrimaryFlag(null);
    baseContact.setRefContactNumber(null);
    baseContact.setRelation(null);
    baseContact.setSalutation(null);
    baseContact.setState(null);
    baseContact.setStreetName(null);
    baseContact.setZip(null);

    // clear people

    basePeople.setBirthDate(null);
    basePeople.setBusName2(null);
    basePeople.setBusinessName(null);
    basePeople.setComment(null); ;
    basePeople.setCompactAddress(null);
    basePeople.setContactSeqNumber(null);
    basePeople.setContactType(null);
    basePeople.setCountry(null);
    basePeople.setCountryCode(null);
    basePeople.setEmail(null);
    basePeople.setEndBirthDate(null);
    basePeople.setFax(null);
    basePeople.setFaxCountryCode(null);
    basePeople.setFirstName(null);
    basePeople.setFlag(null);
    basePeople.setFullName(null);
    basePeople.setGender(null);
    basePeople.setHoldCode(null);
    basePeople.setHoldDescription(null);
    basePeople.setLastName(null);
    basePeople.setMiddleName(null);
    basePeople.setNamesuffix(null);
    basePeople.setPhone1(null);
    basePeople.setPhone1CountryCode(null);
    basePeople.setPhone2(null);
    basePeople.setPhone2CountryCode(null);
    basePeople.setPhone3(null);
    basePeople.setPhone3CountryCode(null);
    basePeople.setPostOfficeBox(null);
    basePeople.setPreferredChannel(null);
    basePeople.setPreferredChannelString(null);
    basePeople.setRelation(null);
    basePeople.setSalutation(null);
    basePeople.setTitle(null);

    // Set Contact Values based on table data

    baseContact.setContactType(contData["Representative Type"].fieldValue);
    baseContact.setLastName(contData["Last Name"].fieldValue);
    baseContact.setFirstName(contData["First Name"].fieldValue);
    baseContact.setMiddleName(contData["Middle Name"].fieldValue);
    baseContact.setFullName(contData["Father's Name"].fieldValue);
    baseContact.setGender(contData["Gender"].fieldValue.substring(0, 1));

    // set People Values

    basePeople.setContactType(contData["Representative Type"].fieldValue);
    basePeople.setLastName(contData["Last Name"].fieldValue);
    basePeople.setFirstName(contData["First Name"].fieldValue);
    basePeople.setMiddleName(contData["Middle Name"].fieldValue);
    basePeople.setFullName(contData["Father's Name"].fieldValue);
    basePeople.setGender(contData["Gender"].fieldValue.substring(0, 1));

    // load up attributes

    baseAttrList.clear();

    baseAttrList.add(createContactAttribute("FAMILY BOOK", contData["Family Book"].fieldValue, "Text", "Y", "Y"));
    baseAttrList.add(createContactAttribute("PARTNER TYPE", contData["Partner Type"].fieldValue, "DropdownList", "Y", "Y"));
    baseAttrList.add(createContactAttribute("SHARE PERCENTAGE", contData["Share Percentage"].fieldValue, "Number", "N", "Y"));
    baseAttrList.add(createContactAttribute("PASSPORT NUMBER", contData["Passport Number"].fieldValue, "Text", "Y", "Y"));
    baseAttrList.add(createContactAttribute("PASSPORT ISSUE DATE", contData["Passport Issue Date"].fieldValue, "Text", "Y", "Y"));
    baseAttrList.add(createContactAttribute("PASSPORT EXPIRY DATE", contData["Passport Expiry Date"].fieldValue, "Text", "Y", "Y"));
    baseAttrList.add(createContactAttribute("NATIONALITY", contData["Nationality"].fieldValue, "DropdownList", "Y", "Y"));
    baseAttrList.add(createContactAttribute("PLACE OF ISSUE (FOR LOCALS)", contData["Place of Issue (for locals)"].fieldValue, "DropdownList", "Y", "Y"));
    baseAttrList.add(createContactAttribute("ID NUMBER", contData["ID Number"].fieldValue, "DropdownList", "Y", "Y"));
    baseAttrList.add(createContactAttribute("BIRTH DATE", contData["Birth Date"].fieldValue, "DropdownList", "Y", "Y"));

    basePeople.setAttributes(baseAttrList)
    baseContact.setPeople(basePeople)

    aa.people.createCapContactWithAttribute(baseContact)

    logDebug("Contact of type " + contData["Representative Type"].fieldValue + " successfully added");

    return true;
}

function getActivityNameById(actId,lang)
	{

	var bz = aa.bizDomain.getBizDomain("Activity Code").getOutput();
	lang = "" + lang;

	if (bz) bz = bz.toArray();

	if (bz)
		{
		for (var thisBz in bz)
			if (bz[thisBz] && bz[thisBz].getDescription() && bz[thisBz].getDescription().equals(actId))
				if (lang.equals("ar_AE"))
					{
               		var arObj = aa.bizDomain.getBizDomainByValue("Activity Code",bz[thisBz].getBizdomainValue(),"ar_AE").getOutput();
               		if (arObj) return arObj.getDispBizdomainValue();
					}
				else
					{
					return bz[thisBz].getBizdomainValue()
					}
		}

	return null;
	}
	
function getTemplateForBranches()
{
	var templateName = null;
	var lEst = "Licenses/Trade Name/Branch/Branch of a Local Establshment";
	var nlEst = "Licenses/Trade Name/Branch/Establshmnt from anthr Emirate";
	var nlComp = "Licenses/Trade Name/Branch/Company from Another Emirate";
	var lComp = "Licenses/Trade Name/Branch/Branch of a Local Company";
	var fComp = "Licenses/Trade Name/Branch/Branch of a Foreign Company";
	var bGCC = "Licenses/Trade Name/Branch/Branch of a GCC";
	var itemCap = capId;
	
	currentCap = aa.cap.getCap(itemCap).getOutput();
	cCapType = currentCap.getCapType().getCapType().trim();

	if (cCapType.equals(lEst))
	{
		return "Establishment - Local Branch";
	}
	else if(cCapType.equals(nlEst))
	{
		return "Establishment - Non Local";
	}
	else if(cCapType.equals(nlComp))
	{
		return "Company - Non Local";
	}
	else if(cCapType.equals(lComp))
	{
		return "Company - Local Branch"
	}
	else if(cCapType.equals(bGCC))
	{
		capContactResult = aa.people.getCapContactByCapID(itemCap);
		if (capContactResult.getSuccess())
		{
			capContactArray = capContactResult.getOutput();
			for (yy in capContactArray)
			{	
				isComp = false;
				isEstab = false;
				isAllGCC = false;
				isfullOwner = false;

				cAttributes = capContactArray[yy].getPeople().getAttributes().toArray();
				for (a in cAttributes)
				{
					if (!cAttributes[a]) continue;
					if(cAttributes[a].attributeName.equals("LEGAL FORM") && cAttributes[a].attributeValue.toUpperCase().equals("ESTABLISHMENT"))
					{
					isEstab = true;
					}
					if(cAttributes[a].attributeName.equals("ALLGCC") && cAttributes[a].attributeValue.toUpperCase().equals("Y"))
					{							
					isAllGCC = true;
					}
					if(cAttributes[a].attributeName.equals("SHARE PERCENTAGE") && cAttributes[a].attributeValue.toUpperCase().equals("100"))
					{
					isfullOwner = true;
					}
					if(cAttributes[a].attributeName.equals("LEGAL FORM") && !cAttributes[a].attributeValue.toUpperCase().equals("ESTABLISHMENT"))
					{
					isComp = true;
					}
				}

				if(isEstab && isfullOwner && isAllGCC)
				{
					return "Establishment - GCC";
				}
				else if(isComp && isfullOwner && isAllGCC)
				{
					return "Company - GCC Branch";
				}
				else if(isfullOwner && !isAllGCC)
				{
					return "Company - Foreign GCC";
				}
				else
				{
					return "Establishment - GCC";
				}
			}
			return templateName;
		}
		else
		{
			aa.print("**Could not retrieve contacts**")
			return false;
		}
	}
	else if(cCapType.equals(fComp))
	{
		return "Company - Foreign Branch";
	}
	else
	{
		return getAppSpecific("Legal Form");
	}
}	

function mailReportToContact(reportName,mSubj,mText,aaReportParamName,aaReportParamValue) // optional capId
{
	var tempCap = capId;
	if (arguments.length > 5)
	{
		tempCap = arguments[5]; // use cap ID specified in args
	}

	var emailTo = "";
	var emailFrom = "eservices@adeconomy.ae";
	var emailCC = "";

	var report = aa.reportManager.getReportInfoModelByName(reportName);
	report = report.getOutput();
	cap = aa.cap.getCap(tempCap).getOutput();
	appTypeString = cap.getCapType().toString();
	appTypeArray = appTypeString.split("/");
 
	report.setModule(appTypeArray[0]);
	report.setCapId(tempCap);

	var parameters = aa.util.newHashMap(); 
	//Make sure the parameters includes some key parameters. 
	if(aaReportParamName && aaReportParamValue)
	{
		parameters.put(aaReportParamName, aaReportParamValue);
	}
	report.setReportParameters(parameters);
	
	var capContResult = aa.people.getCapContactByCapID(tempCap);
	if (capContResult.getSuccess())
	{ 
		conArr = capContResult.getOutput();  
	}
	else
	{
		logDebug ("**WARNING: getting cap contact: " + capAddResult.getErrorMessage());
		return false;
	}

	if (!conArr.length)
	{
		logDebug ("**WARNING: No contact available");
		return false;
	}
		
	for (yy in conArr) 
	{
		cont = conArr[yy];
		peop = cont.getPeople();
		if(peop.getEmail())
		{
			 emailTo += peop.getEmail() + ";";
		}
	}

	mobileEmail = getAppSpecific("Email Address", tempCap);
	if (mobileEmail) 
	{
		emailTo += mobileEmail + ";";
	}

	// Send Report //	
	var reportResult = aa.reportManager.getReportResult(report);
	  
	if(reportResult.getSuccess())
	{
		reportResult = reportResult.getOutput();
		var reportFile = aa.reportManager.storeReportToDisk(reportResult);
		reportFile = reportFile.getOutput();
	  
		var sendResult = aa.sendEmail(emailFrom, emailTo, "", mSubj, mText, reportFile);
	  
		if(sendResult.getSuccess()) {
			logDebug("Report successfully emailed");
		}
		else {
		logDebug("Email Failed");
		}
	}
	else 
	{
		logDebug("Report Generation Failed");
	}
}
function updateFee(fcode,fsched,fperiod,fqty,finvoice,pDuplicate,pFeeSeq) 
	{
    // Updates an assessed fee with a new Qty.  If not found, adds it; else if invoiced fee found, adds another with adjusted qty.
    // optional param pDuplicate -if "N", won't add another if invoiced fee exists (SR5085)
    // Script will return fee sequence number if new fee is added otherwise it will return null (SR5112)
    // Optional param pSeqNumber, Will attempt to update the specified Fee Sequence Number or Add new (SR5112)
        
    // If optional argument is blank, use default logic (i.e. allow duplicate fee if invoiced fee is found)        
    if ( pDuplicate==null || pDuplicate.length==0 )
        pDuplicate = "Y";
    else
        pDuplicate = pDuplicate.toUpperCase();
        
    var invFeeFound=false;    
    var adjustedQty=fqty;
    var feeSeq = null;
	feeUpdated = false;

	if(pFeeSeq == null)
		getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
	else
		getFeeResult = aa.finance.getFeeItemByPK(capId,pFeeSeq);


	if (getFeeResult.getSuccess())
		{
		if(pFeeSeq == null)
			var feeList = getFeeResult.getOutput();
		else
		     {
			var feeList = new Array();
			feeList[0] = getFeeResult.getOutput();
		     }
		for (feeNum in feeList)
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
                    if (pDuplicate=="Y")
                        {
                        logDebug("Invoiced fee "+fcode+" found, subtracting invoiced amount from update qty.");
        				adjustedQty = fqty - feeList[feeNum].getFeeUnit();
                        invFeeFound=true;
                        }
                    else
                        {
                        invFeeFound=true;
                        logDebug("Invoiced fee "+fcode+" found.  Not updating this fee. Not assessing new fee "+fcode);
                        }
				}

		for (feeNum in feeList)
			if (feeList[feeNum].getFeeitemStatus().equals("NEW") && !feeUpdated)  // update this fee item
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();
				var editResult = aa.finance.editFeeItemUnit(capId, fqty, feeSeq);
				feeUpdated = true;
				if (editResult.getSuccess())
					{
					logDebug("Updated Qty on Existing Fee Item: " + fcode + " to Qty: " + fqty);
					if (finvoice == "Y")
						{
						feeSeqList.push(feeSeq);
						paymentPeriodList.push(fperiod);
						}
					}
				else
					{ logDebug( "**ERROR: updating qty on fee item (" + fcode + "): " + editResult.getErrorMessage()); break }
				}
		}
	else
		{ logDebug( "**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())}

    // Add fee if no fee has been updated OR invoiced fee already exists and duplicates are allowed
	if ( !feeUpdated && adjustedQty != 0 && (!invFeeFound || invFeeFound && pDuplicate=="Y") ) 
		feeSeq = addFee(fcode,fsched,fperiod,adjustedQty,finvoice);
	else
		feeSeq = null;
			
	return feeSeq;
	}
	

function loadFees()  // option CapId
{
    //  load the fees into an array of objects.  Does not
    var itemCap = capId
    if (arguments.length > 0) {
        ltcapidstr = arguments[0]; // use cap ID specified in args
        if (typeof (ltcapidstr) == "string") {
            var ltresult = aa.cap.getCapID(ltcapidstr);
            if (ltresult.getSuccess())
                itemCap = ltresult.getOutput();
            else
            { //aa.print("**ERROR: Failed to get cap ID: " + ltcapidstr + " error: " + ltresult.getErrorMessage()); 
		return false; }
        }
        else
            itemCap = ltcapidstr;
    }

    //aa.print("loading fees for cap " + itemCap.getCustomID());
    var feeArr = new Array();

    var feeResult = aa.fee.getFeeItems(itemCap);
    if (feeResult.getSuccess())
    { var feeObjArr = feeResult.getOutput(); }
    else
    { //aa.print("**ERROR: getting fee items: " + capContResult.getErrorMessage()); 
	return false; }

    for (ff in feeObjArr) {
        fFee = feeObjArr[ff];
        var myFee = new Fee();
        var amtPaid = 0;

        var pfResult = aa.finance.getPaymentFeeItems(itemCap, null);
        if (pfResult.getSuccess()) {
            var pfObj = pfResult.getOutput();
            for (ij in pfObj)
                if (fFee.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
                amtPaid += pfObj[ij].getFeeAllocation()
        }

        myFee.sequence = fFee.getFeeSeqNbr();
        myFee.code = fFee.getFeeCod();
        myFee.sched = fFee.getF4FeeItemModel().getFeeSchudle();
        myFee.description = fFee.getFeeDescription();
        myFee.unit = fFee.getFeeUnit();
        myFee.amount = fFee.getFee();
        myFee.amountPaid = amtPaid;
        if (fFee.getApplyDate()) myFee.applyDate = convertDate(fFee.getApplyDate());
        if (fFee.getEffectDate()) myFee.effectDate = convertDate(fFee.getEffectDate());
        if (fFee.getExpireDate()) myFee.expireDate = convertDate(fFee.getExpireDate());
        myFee.status = fFee.getFeeitemStatus();
        myFee.period = fFee.getPaymentPeriod();
        myFee.display = fFee.getDisplay();
        myFee.accCodeL1 = fFee.getAccCodeL1();
        myFee.accCodeL2 = fFee.getAccCodeL2();
        myFee.accCodeL3 = fFee.getAccCodeL3();
        myFee.formula = fFee.getFormula();
        myFee.udes = fFee.getUdes();
        myFee.UDF1 = fFee.getUdf1();
        myFee.UDF2 = fFee.getUdf2();
        myFee.UDF3 = fFee.getUdf3();
        myFee.UDF4 = fFee.getUdf4();
        myFee.subGroup = fFee.getSubGroup();
        myFee.calcFlag = fFee.getCalcFlag(); ;
        myFee.calcProc = fFee.getFeeCalcProc();

        feeArr.push(myFee)
    }

    return feeArr;
}
//Custom for ADBC. Stock function does not work in Arabic.
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;
	
	var bizDomScriptResult = aa.bizDomain.getBizDomain(strControl);
	
	if (bizDomScriptResult.getSuccess())
		{
		bizDomScriptArray = bizDomScriptResult.getOutput().toArray()
		
		//Need to sort for Arabic
		bizDomScriptArray.sort(sortNumerically);
		for (var i in bizDomScriptArray)
			{					
			var myObj= new pairObj(bizDomScriptArray[i].getBizdomainValue());
			myObj.load(bizDomScriptArray[i].getDescription());
			if (bizDomScriptArray[i].getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		}
	
	return actArray;
	}
function sortNumerically(a, b)
{
	return (a.getBizdomainValue() - b.getBizdomainValue())
}

function setContactBusinessNameToAppName()
{
   aa.debug("Michael2014317,setContactBusinessNameToAppName==",setContactBusinessNameToAppName);
   var contactResult = aa.people.getCapContactByCapID(capId);
    aa.debug("Michael2014317,capId==",capId);
   if(contactResult.getSuccess())
   {
          var cdScriptObjResult = aa.cap.getCapDetail(capId);
	  if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }
	  var cdScriptObj = cdScriptObjResult.getOutput();
	  if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }
	  cd = cdScriptObj.getCapDetailModel();
	  
	  
	  
          var contactlist = contactResult.getOutput();
	  var cCap = aa.cap.getCap(capId).getOutput();
	  
	  var currentCap =  cCap.getCapModel();
	  for(var contact in contactlist)
	  {	   
	      var capcontact  = contactlist[contact].getCapContactModel();
              aa.debug("Michael2014317,capcontact.getTradeName()==",capcontact.getTradeName());
	      aa.debug("Michael2014317,capcontact.getBusinessName()==",capcontact.getBusinessName());
		  
              currentCap.setSpecialText(capcontact.getBusinessName());		  
	      aa.cap.editCapByPK(currentCap);
		  
	      cd.setShortNotes(capcontact.getTradeName());
	      cdWrite = aa.cap.editCapDetail(cd)
	      if (!cdWrite.getSuccess())
			{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	  }
	}
}
function validateAEFees()
{
   var cal = 0;
   for (x in wfTSI)
		{
                                if(wfTSI[x].getCheckboxDesc()=="Amount" && wfTSI[x].getChecklistComment()!=null&& wfTSI[x].getChecklistComment()!="")
                  {
                     cal = cal +1;
                     break;
                    
                   }else if (wfTSI[x].getCheckboxDesc()=="Amount 2" && wfTSI[x].getChecklistComment()!=null&& wfTSI[x].getChecklistComment()!="")
                   {
                     cal = cal +1;
                     break;

                   }else if (wfTSI[x].getCheckboxDesc()=="Amount 3" && wfTSI[x].getChecklistComment()!=null&& wfTSI[x].getChecklistComment()!="")
                   {
                     cal = cal +1;
                     break;

                   }else if (wfTSI[x].getCheckboxDesc()=="Amount 4" && wfTSI[x].getChecklistComment()!=null&& wfTSI[x].getChecklistComment()!="")
                   {
                     cal = cal +1;
                     break;

                   }else if (wfTSI[x].getCheckboxDesc()=="Amount 5" && wfTSI[x].getChecklistComment()!=null&& wfTSI[x].getChecklistComment()!="")
                   {
                     cal = cal +1;
                     break;

                   }

	        }
    aa.print("cal=="+cal);
    if(cal > 0)
   {
      return false;

   }
   else
   {
    return true;
   }

}

function getAENewFees()
{

       var invFeeSeqList = new Array();
	var invPaymentPeriodList = new Array();


	var skipArray = new Array();
	var invoiceAll = false;
	if (arguments.length > 0)
		{
		for (var i=0; i<arguments.length; i++)
			skipArray.push(arguments[i]);
		}
	else
		invoiceAll = true;


	var feeA = loadFees(capId)
        var deptName = getDepartmentName(currentUserID);
	for (var x in feeA)
		{
		var thisFee = feeA[x];
		if (!invoiceAll && (exists(thisFee.accCodeL1,skipArray) || thisFee.code == "AE FEE POST")) continue;

		if ((thisFee.status.equals("NEW") && thisFee.amount*1 > 0)&&thisFee.sched.equals(deptName.toUpperCase()) )
			{
			invFeeSeqList.push(thisFee.sequence);
			invPaymentPeriodList.push(thisFee.period);
            logDebug("Assessed fee "+thisFee.code+" found and tagged for invoicing");
            }
        }
        aa.print("invFeeSeqList==" +invFeeSeqList);

	if (invFeeSeqList.length>0 && invFeeSeqList !=null &&invFeeSeqList != "")
	{
		  return true;
	}
	else
	{
		  return false;
	}
		

}
//fish 04/10/2014. function to format javascript date to string in specific format.
//Add to it as necessary
function dateFormat(dateObj, fstring)
{
	var rsult = "";
	switch(fstring.toUpperCase())
	{
		case "DD/MM/YYYY HH:MM:SS":
		result = dateObj.getDate() + "/" + dateObj.getMonth() + "/" + dateObj.getFullYear() + " " + 
		dateObj.getHours() + ":" + dateObj.getMinutes() + ":" + dateObj.getSeconds();
		break;
	
		default:
		result = "Could not format date";
		break;
	}
	return result;
}
function createRefContactsFromCapContactsAndLink(pCapId, ignoreArray, replaceCapContact, overwriteRefContact, refContactExists)
	{

	// ignoreArray is a list of attributes to ignore when creating a REF contact
	//
	// replaceCapContact and overwriteRefContact are not implemented yet
	//
	// refContactExists is a function for REF contact comparisons.
	//
	var ingoreArray = new Array();
	if (arguments.length > 1) ignoreArray = arguments[1];

	var c = aa.people.getCapContactByCapID(pCapId).getOutput()
	var cCopy = aa.people.getCapContactByCapID(pCapId).getOutput()  // must have two working datasets

	for (var i in c)
	   {
	   var con = c[i];

	   if (!con.getCapContactModel().getRefContactNumber())  // user entered data
	       {

			var p = con.getPeople();
			var ccmSeq = p.getContactSeqNumber();


			//
			// Call the custom function to see if the REF contact exists
			//

			existingContact = refContactExists(p);

			// refresh the people since we had to mangle it for the search

			p = cCopy[i].getPeople();  // get a fresh version, had to mangle the first for the search

			// check to see if we are linking to existing or creating

			if (existingContact)
				{
					refPeopleId = existingContact;
				}
			else
				{

				var a = p.getAttributes();

				if (a)
					{
					//
					// Clear unwanted attributes
					var ai = a.iterator();
					while (ai.hasNext())
						{
						var xx = ai.next();
						if (exists(xx.getAttributeName().toUpperCase(),ignoreArray))
							ai.remove();
						}
					}

				r = aa.people.createPeopleWithAttribute(p,a);

				if (!r.getSuccess())
					{logDebug("WARNING: couldn't create reference people : " + r.getErrorMessage()); continue; }

				//
				// createPeople is nice and updates the sequence number to the ref seq
				//

				var p = cCopy[i].getPeople();
				var refPeopleId = p.getContactSeqNumber();

				logDebug("Successfully created reference contact #" + refPeopleId);
				}

			//
			// now that we have the reference Id, we can link back to reference
			//

		    var ccm = aa.people.getCapContactByPK(pCapId,ccmSeq).getOutput().getCapContactModel();

		    ccm.setRefContactNumber(refPeopleId);
		    r = aa.people.editCapContact(ccm);

		    if (!r.getSuccess())
				{ logDebug("WARNING: error updating cap contact model : " + r.getErrorMessage()); }
			else
				{ logDebug("Successfully linked ref contact " + refPeopleId + " to cap contact " + ccmSeq);}


	    }
	}

}

function closeAllOpenProcessTasks(thisProcessID,taskStat,taskComment) // optional capId
	{
	var itemCap = capId;
	if (arguments.length == 4) itemCap = arguments[3]; // use cap ID specified in args


	var workflowResult = aa.workflow.getTasks(itemCap);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else
		{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
		var fTaskSM = wfObj[i];
		if (fTaskSM.getProcessID() == thisProcessID && fTaskSM.getActiveFlag() == "Y")
			{
			//aa.print("found an active task: " + stepnumber + " , " + thisProcessID);
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTaskSM.getStepNumber();
			aa.workflow.handleDisposition(itemCap,stepnumber,thisProcessID,taskStat,dispositionDate, taskComment,taskComment,systemUserObj ,"Y");
			}
		}
	}