/*------------------------------------------------------------------------------------------------------/
| SVN $Id: WorkflowTaskUpdateAfter.js 1249 2008-01-10 18:57:01Z john.schomp $
| Program : WorkflowTaskUpdateAfterV1.4.js
| Event   : WorkflowTaskUpdateAfter
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : DQ-2/11/09 - Added editCompletedDate
|	    DQ - 12/3/10 - removed aa.print()
|	    DQ - 1/11 - updated sendSMS()
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false;						// Set to true to see results in popup window
var showDebug = 3;							// Set to true to see debug messages in popup window
var controlString = "WorkflowTaskUpdateAfter"; 				// Standard choice for control
var preExecute = "PreExecuteForAfterEvents";				// Standard choice to execute first (for globals, etc)
var documentOnly = false;						// Document Only -- displays hierarchy of std choice steps
var disableTokens = false;						// turn off tokenizing of std choices (enables use of "{} and []")
var useAppSpecificGroupName = false;					// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;					// Use Group name when populating Task Specific Info Values
var enableVariableBranching = false;					// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;							// Maximum number of std choice entries.  Entries must be Left Zero Padded
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";							// Message String
var debug = "";								// Debug String
var br = "<BR>";					// Break Tag
var li = "<li>";					// List Start
var endli = "</li>";					// List end
var feeSeqList = new Array();						// invoicing fee list
var paymentPeriodList = new Array();					// invoicing pay periods

if (documentOnly) {
	doStandardChoiceActions(controlString,false,0);
	aa.env.setValue("ScriptReturnCode", "0");
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript();
	}

var capId = getCapId();							// CapId object
var cap = aa.cap.getCap(capId).getOutput();				// Cap object
var servProvCode = capId.getServiceProviderCode()       		// Service Provider Code
var publicUser = false;
var currentUserID = aa.env.getValue("CurrentUserID");
var parentCapId = null
var parentCapString = "" + aa.env.getValue("ParentCapID");
if (parentCapString.length > 0) { parentArray = parentCapString.split("-") ; parentCapId = aa.cap.getCapID(parentArray[0],parentArray[1],parentArray[2]).getOutput(); }
if (currentUserID.indexOf("PUBLICUSER") == 0) { currentUserID = "ADMIN" ; publicUser = true }  // ignore public users
var partialCap = !cap.isCompleteCap();
var capIDString = capId.getCustomID();					// alternate cap id string
var systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
var appTypeResult = cap.getCapType();
var appTypeString = appTypeResult.toString();				// Convert application type to string ("Building/A/B/C")
var appTypeArray = appTypeString.split("/");				// Array of application type string
var currentUserGroup;
var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
var capName = cap.getSpecialText();
var capStatus = cap.getCapStatus();
var fileDateObj = cap.getFileDate();					// File Date scriptdatetime
var fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
var fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"YYYY-MM-DD");
var parcelArea = 0;

var estValue = 0; var calcValue = 0; var feeFactor			// Init Valuations
var valobj = aa.finance.getContractorSuppliedValuation(capId,null).getOutput();	// Calculated valuation
if (valobj.length) {
	estValue = valobj[0].getEstimatedValue();
	calcValue = valobj[0].getCalculatedValue();
	feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
	}

var balanceDue = 0 ; var houseCount = 0; feesInvoicedTotal = 0;		// Init detail Data
var capDetail = "";
var capDetailObjResult = aa.cap.getCapDetail(capId);			// Detail
if (capDetailObjResult.getSuccess())
	{
	capDetail = capDetailObjResult.getOutput();
	var houseCount = capDetail.getHouseCount();
	var feesInvoicedTotal = capDetail.getTotalFee();
	var balanceDue = capDetail.getBalance();
	}

/*****************Script Text Start*************************/
//define a object
var FieldInfo = function(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;
};

var AInfo = new Array();						// Create array for tokenized variables
loadAppSpecific(AInfo); 						// Add AppSpecific Info
loadTaskSpecific(AInfo);						// Add task specific info
loadParcelAttributes(AInfo);						// Add parcel attributes
loadASITables();


logDebug("<B>EMSE Script Results for " + capIDString + "</B>");
logDebug("capId = " + capId.getClass());
logDebug("cap = " + cap.getClass());
logDebug("currentUserID = " + currentUserID);
logDebug("currentUserGroup = " + currentUserGroup);
logDebug("systemUserObj = " + systemUserObj.getClass());
logDebug("appTypeString = " + appTypeString);
logDebug("capName = " + capName);
logDebug("capStatus = " + capStatus);
logDebug("fileDate = " + fileDate);
logDebug("fileDateYYYYMMDD = " + fileDateYYYYMMDD);
logDebug("sysDate = " + sysDate.getClass());
logDebug("sysDateMMDDYYYY = " + sysDateMMDDYYYY);
logDebug("parcelArea = " + parcelArea);
logDebug("estValue = " + estValue);
logDebug("calcValue = " + calcValue);
logDebug("feeFactor = " + feeFactor);

logDebug("houseCount = " + houseCount);
logDebug("feesInvoicedTotal = " + feesInvoicedTotal);
logDebug("balanceDue = " + balanceDue);

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var wfTask = aa.env.getValue("WorkflowTask");				// Workflow Task Triggered event
var wfStatus = aa.env.getValue("WorkflowStatus");			// Status of workflow that triggered event
var wfDate = aa.env.getValue("WorkflowStatusDate");			// date of status of workflow that triggered event
var wfDateMMDDYYYY = wfDate.substr(5,2) + "/" + wfDate.substr(8,2) + "/" + wfDate.substr(0,4);	// date of status of workflow that triggered event in format MM/DD/YYYY
var wfProcessID = aa.env.getValue("ProcessID");				// Process ID of workflow
var wfStep ; var wfComment ; var wfNote ; var wfDue ;			// Initialize
var wfProcess ; 							// Initialize
// Go get other task details
var wfObj = aa.workflow.getTasks(capId).getOutput();
for (i in wfObj)
	{
	fTask = wfObj[i];
	if (fTask.getTaskDescription().equals(wfTask) && (fTask.getProcessID() == wfProcessID))
		{
		wfStep = fTask.getStepNumber();
		wfProcess = fTask.getProcessCode();
		wfComment = fTask.getDispositionComment();
		wfNote = fTask.getDispositionNote();
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}
logDebug("wfProcessID = " + wfProcessID);
logDebug("wfTask = " + wfTask);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
logDebug("wfStatus = " + wfStatus);
logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfStep = " + wfStep);
logDebug("wfComment = " + wfComment);
logDebug("wfProcess = " + wfProcess);
logDebug("wfNote = " + wfNote);
/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);

/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/

doStandardChoiceActions(controlString,true,0);

//
// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logDebug("Invoicing assessed fee items is successful.");
	else
		logDebug("**ERROR: Invoicing the fee items assessed to app # " + capIDString + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
	}

/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("**ERROR") > 0)
	{
	aa.env.setValue("ScriptReturnCode", "1");
	aa.env.setValue("ScriptReturnMessage", debug);
	}
else
	{
	aa.env.setValue("ScriptReturnCode", "0");
	if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
	if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);

	}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/
function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 10)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 10)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
	}

function logGlobals(globArray) {

	for (loopGlob in globArray)
		logDebug("{" + loopGlob + "} = " + globArray[loopGlob])
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


//
// matches:  returns true if value matches any of the following arguments
//
function matches(eVal,argList) {
   for (var i=1; i<arguments.length;i++)
   	if (arguments[i] == eVal)
   		return true;

}

//
// exists:  return true if Value is in Array
//
function exists(eVal, eArray) {
	  for (ii in eArray)
	  	if (eArray[ii] == eVal) return true;
	  return false;
}

//
// Get the standard choices domain for this application type
//
function getScriptAction(strControl)
	{
	var actArray = new Array();
	var maxLength = String("" + maxEntries).length;

	for (var count=1; count <= maxEntries; count++)  // Must be sequential from 01 up to maxEntries
		{
		var countstr = "000000" + count;
		countstr = String(countstr).substring(countstr.length,countstr.length - maxLength);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(strControl,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			bizDomScriptObj = bizDomScriptResult.getOutput();
			var myObj= new pairObj(bizDomScriptObj.getBizdomainValue());
			myObj.load(bizDomScriptObj.getDescription());
			if (bizDomScriptObj.getAuditStatus() == 'I') myObj.enabled = false;
			actArray.push(myObj);
			}
		else
			{
			break;
			}
		}
	return actArray;
	}

function doStandardChoiceActions(stdChoiceEntry,doExecution,docIndent)
	{
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	var lastEvalTrue = false;
	logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	var pairObjArray = getScriptAction(stdChoiceEntry);
	if (!doExecution) docWrite(stdChoiceEntry,true,docIndent);
	for (xx in pairObjArray)
		{
		doObj = pairObjArray[xx];
		if (doExecution)
			{
			if (doObj.enabled)
				{
				logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						{
						logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
						eval(token(doObj.elseact));
						}
					lastEvalTrue = false;
					}
				}
			}
		else // just document
			{
			docWrite("|  ",false,docIndent);
			var disableString = "";
			if (!doObj.enabled) disableString = "<DISABLED>";

			if (doObj.elseact)
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact ,false,docIndent);
			else
				docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act,false,docIndent);

			for (yy in doObj.branch)
				{
				doStandardChoiceActions(doObj.branch[yy],false,docIndent+1);
				}
			}
		} // next sAction
	if (!doExecution) docWrite(null,true,docIndent);
	var thisDate = new Date();
	var thisTime = thisDate.getTime();
	logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
	}

function docWrite(dstr,header,indent)
	{
	var istr = "";
	for (i = 0 ; i < indent ; i++)
		istr+="|  ";
	if (header && dstr)
		aa.print(istr + "------------------------------------------------");
	if (dstr) aa.print(istr + dstr);
	if (header)
		aa.print(istr + "------------------------------------------------");
	}


function token(tstr)
	{
	if (!disableTokens)
		{
		re = new RegExp("\\{","g") ; tstr = String(tstr).replace(re,"AInfo[\"");
		re = new RegExp("\\}","g") ; tstr = String(tstr).replace(re,"\"]");
		}
	return String(tstr);
  	}

function pairObj(actID)
	{
	this.ID = actID;
	this.cri = null;
	this.act = null;
	this.elseact = null;
	this.enabled = true;
	this.continuation = false;
	this.branch = new Array();

	this.load = function(loadStr) {
		//
		// load() : tokenizes and loades the criteria and action
		//
		loadArr = loadStr.split("\\^");
		if (loadArr.length < 2 || loadArr.length > 3)
			{
			logMessage("**ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line

			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (!enableVariableBranching && bb >= 0)
			  {
			  var cc = a.substring(bb);
			  var dd = cc.indexOf("\")");
			  this.branch.push(cc.substring(8,dd));
			  a = cc.substring(dd);
			  bb = a.indexOf("branch");
			  }

			}
		}
	}

function convertDate(thisDate)
// convert ScriptDateTime to Javascript Date Object
	{
	return new Date(thisDate.getMonth() + "/" + thisDate.getDayOfMonth() + "/" + thisDate.getYear());
	}


function logDebug(dstr)
	{
	vLevel = 1
	if (arguments.length > 1)
		vLevel = arguments[1]

	if( (showDebug & vLevel) ==  vLevel || vLevel == 1)
		debug+=dstr + br;

	if(  (showDebug & vLevel) ==  vLevel  )
		aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"),dstr)

	}

function logMessage(dstr)
	{
	message+=li + dstr + endli;
	}

/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function activateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "Y", "N", null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "Y", "N", null, null)

			logMessage("Activating Workflow Task: " + wfstr);
			logDebug("Activating Workflow Task: " + wfstr);
			}
		}
	}


function addAddressCondition(addNum, cType,cStatus,cDesc,cComment,cImpact)
//if addNum is null, condition is added to all addresses on CAP
	{
	if (!addNum)
		{
		var capAddResult = aa.address.getAddressByCapId(capId);
		if (capAddResult.getSuccess())
			{
			var Adds = capAddResult.getOutput();
			for (zz in Adds)
				{

				if (Adds[zz].getRefAddressId())
					{
					var addAddCondResult = aa.addressCondition.addAddressCondition(Adds[zz].getRefAddressId(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

						if (addAddCondResult.getSuccess())
							{
							logDebug("Successfully added condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + ") " + cDesc);
							}
						else
							{
							logDebug( "**ERROR: adding condition to reference Address " + Adds[zz].getRefAddressId() + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
							}
					}
				}
			}
		}
	else
		{
			var addAddCondResult = aa.addressCondition.addAddressCondition(addNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);


		        if (addAddCondResult.getSuccess())
		        	{
				logDebug("Successfully added condition to Address " + addNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
				logDebug( "**ERROR: adding condition to Address " + addNum + "  (" + cImpact + "): " + addAddCondResult.getErrorMessage());
				}
		}
	}


function addAllFees(fsched,fperiod,fqty,finvoice) // Adds all fees for a given fee schedule
	{
	var arrFees = aa.finance.getFeeItemList(null,fsched,null).getOutput();
	for (xx in arrFees)
		{
		var feeCod = arrFees[xx].getFeeCod();
		var assessFeeResult = aa.finance.createFeeItem(capId,fsched,feeCod,fperiod,fqty);
		if (assessFeeResult.getSuccess())
			{
			var feeSeq = assessFeeResult.getOutput();
			logMessage("Added Fee " + feeCod + ", Qty " + fqty);
			logDebug("The assessed fee Sequence Number " + feeSeq);
			if (finvoice == "Y")
			{
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
				}
			}
		else
			{
			logDebug( "**ERROR: assessing fee (" + feeCod + "): " + assessFeeResult.getErrorMessage());
			}
		} // for xx
	} // function

function addAppCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
        var tempCap = capId;
        if (arguments.length > 5)
		{
		tempCap = arguments[5]; // use cap ID specified in args		
		}
	var addCapCondResult = aa.capCondition.addCapCondition(tempCap, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		logMessage("Successfully added condition (" + cImpact + ") " + cDesc);
		logDebug("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		logDebug( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}

function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
		feeSeq = assessFeeResult.getOutput();
		logDebug("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
		logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

		if (finvoice == "Y" && arguments.length == 5) // use current CAP
			{
			feeSeqList.push(feeSeq);
			paymentPeriodList.push(fperiod);
			}
		if (finvoice == "Y" && arguments.length > 5) // use CAP in args
			{
			feeSeq_L.push(feeSeq);
			paymentPeriod_L.push(fperiod);
			var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
			if (invoiceResult_L.getSuccess())
				logMessage("Invoicing assessed fee items" + feeCapMessage + " is successful.");
			else
				logDebug("**ERROR: Invoicing the fee items assessed" + feeCapMessage + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
			}
		}
	else
		{
		logDebug( "**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
		}
		return feeSeq;
	}


function addLicenseCondition(cType,cStatus,cDesc,cComment,cImpact)
	{
	// Optional 6th argument is license number, otherwise add to all CAEs on CAP
	refLicArr = new Array();
	if (arguments.length == 6) // License Number provided
		{
		refLicArr.push(getRefLicenseProf(arguments[5]));
		}
	else // adding to cap lic profs
		{
		var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
		if (capLicenseResult.getSuccess())
			{ var refLicArr = capLicenseResult.getOutput();  }
		else
			{ logDebug("**ERROR: getting lic profs from Cap: " + capLicenseResult.getErrorMessage()); return false; }
		}

	for (var refLic in refLicArr)
		{
		if (arguments.length == 6) // use sequence number
			licSeq = refLicArr[refLic].getLicSeqNbr();
		else
			licSeq = refLicArr[refLic].getLicenseNbr();

		var addCAEResult = aa.caeCondition.addCAECondition(licSeq, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj)

		if (addCAEResult.getSuccess())
			{
			logDebug("Successfully added licensed professional (" + licSeq + ") condition (" + cImpact + ") " + cDesc);
			}
		else
			{
			logDebug( "**ERROR: adding licensed professional (" + licSeq + ") condition (" + cImpact + "): " + addCAEResult.getErrorMessage());
			}
		}
	}

function addLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, don't add
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		logDebug("Standard Choices Item "+stdChoice+" and Value "+stdValue+" already exist.  Lookup is not added or updated.");
		return false;
		}

	//Proceed to add
	var strControl;

	if (stdChoice != null && stdChoice.length && stdValue != null && stdValue.length && stdDesc != null && stdDesc.length)
		{
		var bizDomScriptResult = aa.bizDomain.createBizDomain(stdChoice, stdValue, "A", stdDesc)

		if (bizDomScriptResult.getSuccess())

			//check if new Std Choice actually created



			logDebug("Successfully created Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
		else
			logDebug("**ERROR creating Std Choice " + bizDomScript.getErrorMessage());
		}
	else
		logDebug("Could not create std choice, one or more null values");
	}

function addParcelCondition(parcelNum, cType,cStatus,cDesc,cComment,cImpact)
//if parcelNum is null, condition is added to all parcels on CAP
	{
	if (!parcelNum)
		{
		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (capParcelResult.getSuccess())
			{
			var Parcels = capParcelResult.getOutput().toArray();
			for (zz in Parcels)
				{
				logDebug("Adding Condition to parcel #" + zz + " = " + Parcels[zz].getParcelNumber());
				var addParcelCondResult = aa.parcelCondition.addParcelCondition(Parcels[zz].getParcelNumber(), cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
					if (addParcelCondResult.getSuccess())
					        	{
						logMessage("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
						logDebug("Successfully added condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + ") " + cDesc);
						}
					else
						{
						logDebug( "**ERROR: adding condition to Parcel " + Parcels[zz].getParcelNumber() + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
						}
				}
			}
		}
	else
		{
			var addParcelCondResult = aa.parcelCondition.addParcelCondition(parcelNum, cType, cDesc, cComment, null, null, cImpact, cStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);

		        if (addParcelCondResult.getSuccess())
		        	{
				logMessage("Successfully added condition to Parcel " + parcelNum + "  (" + cImpact + ") " + cDesc);
				logDebug("Successfully added condition to Parcel " + parcelNum + "  (" + cImpact + ") " + cDesc);
				}
			else
				{
			logDebug( "**ERROR: adding condition to Parcel " + parcelNum + "  (" + cImpact + "): " + addParcelCondResult.getErrorMessage());
				}
		}
	}

function addParcelDistrict(parcelNum, districtValue)
//if parcelNum is null, district is is added to all parcels on CAP
	{
	if (!parcelNum)
		{
		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (capParcelResult.getSuccess())
			{
			var Parcels = capParcelResult.getOutput().toArray();
			for (zz in Parcels)
				{
				apdResult = aa.parcel.addParceDistrictForDaily(capId.getID1(),capId.getID2(),capId.getID3(),Parcels[zz].getParcelNumber(),districtValue);

				if (!apdResult.getSuccess())
					{ logDebug("**ERROR Adding District " + districtValue + " to parcel #" + Parcels[zz].getParcelNumber() + " : " + apdResult.getErrorMessage()) ; return false ; }
				else
					logDebug("Successfully added district " + districtValue + " to parcel #" + Parcels[zz].getParcelNumber());

				}
			}
		}
	else
		{
		apdResult = aa.parcel.addParceDistrictForDaily(capId.getID1(),capId.getID2(),capId.getID3(),parcelNum,districtValue);

		if (!apdResult.getSuccess())
			{ logDebug("**ERROR Adding District " + districtValue + " to parcel #" + parcelNum + " : " + apdResult.getErrorMessage()) ; return false ; }
		else
			logDebug("Successfully added district " + districtValue + " to parcel #" + parcelNum);
		}
	}

function addParent(parentAppNum)
//
// adds the current application to the parent
//
	{
	var getCapResult = aa.cap.getCapID(parentAppNum);
	if (getCapResult.getSuccess())
		{
		var parentId = getCapResult.getOutput();
		var linkResult = aa.cap.createAppHierarchy(parentId, capId);
		if (linkResult.getSuccess())
			logDebug("Successfully linked to Parent Application : " + parentAppNum);
		else
			logDebug( "**ERROR: linking to parent application parent cap id (" + parentAppNum + "): " + linkResult.getErrorMessage());
		}
	else
		{ logDebug( "**ERROR: getting parent cap id (" + parentAppNum + "): " + getCapResult.getErrorMessage()) }
	}

function addrAddCondition(pAddrNum, pType, pStatus, pDesc, pComment, pImpact, pAllowDup)
	{
	//if pAddrNum is null, condition is added to all addresses on CAP
	//06SSP-00223
	//
	if (pAllowDup=="Y")
		var noDup = false;
	else
		var noDup = true;

	var condAdded = false;

	if (!pAddrNum) //no address num, add condition to all addresses on CAP
		{
		var capAddrResult = aa.address.getAddressByCapId(capId);
		if (capAddrResult.getSuccess())
			{
			var addCondResult;
			var addCondResult2;
			var getCondResult;
			var condArray;
			var addresses = capAddrResult.getOutput();

			addCondLoop:  //loop identifier
			for (zz in addresses)
				{
				var addrRefId = addresses[zz].getRefAddressId();
				if (addrRefId==null)
					{
					logDebug("No reference address ID found for Address "+zz);
					continue;
					}

				if (noDup) //Check if this address has duplicate condition
					{
					var cType;
					var cStatus;
					var cDesc;
					var cImpact;

					getCondResult = aa.addressCondition.getAddressConditions(addrRefId);
					condArray = getCondResult.getOutput();
					if (condArray.length>0)
						{
						for (bb in condArray)
							{
							cType = condArray[bb].getConditionType();
							cStatus = condArray[bb].getConditionStatus();
							cDesc = condArray[bb].getConditionDescription();
							cImpact = condArray[bb].getImpactCode();
							if (cType==null)
								cType = " ";
							if (cStatus==null)
								cStatus = " ";
							if (cDesc==null)
								cDesc = " ";
							if (cImpact==null)
								cImpact = " ";
							if ( (pType==null || pType.toUpperCase()==cType.toUpperCase()) && (pStatus==null || pStatus.toUpperCase()==cStatus.toUpperCase()) && (pDesc==null || pDesc.toUpperCase()==cDesc.toUpperCase()) && (pImpact==null || pImpact.toUpperCase()==cImpact.toUpperCase()) )
								{
								logMessage("Condition already exists: New condition not added to Address ID "+addrRefId);
								logDebug("Condition already exists: New condition not added to Address ID "+addrRefId);
								continue addCondLoop; //continue to next address without adding condition
								}
							}
						}
					}

				logDebug("Adding Condition to address " + zz + " = " + addrRefId);
				addCondResult = aa.addressCondition.addAddressCondition(addrRefId, pType, pDesc, pComment, null, null, pImpact, pStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
				if (addCondResult.getSuccess())
					{
					logMessage("Successfully added condition to Address ID " + addrRefId + "  (" + pImpact + ") " + pDesc);
					logDebug("Successfully added condition to Address ID " + addrRefId + "  (" + pImpact + ") " + pDesc);
					condAdded=true;
					}
				else
					{
					logDebug( "**ERROR: adding condition to Address " + addrRefId + "  (" + pImpact + "): " + addCondResult.getErrorMessage());
					}
				}
			}
		}
	else //add condition to specified address only
		{
		if (noDup) //Check if this address has duplicate condition
			{
			var cType;
			var cStatus;
			var cDesc;
			var cImpact;

			getCondResult = aa.addressCondition.getAddressConditions(pAddrNum);
			condArray = getCondResult.getOutput();
			if (condArray.length>0)
				{
				for (bb in condArray)
					{
					cType = condArray[bb].getConditionType();
					cStatus = condArray[bb].getConditionStatus();
					cDesc = condArray[bb].getConditionDescription();
					cImpact = condArray[bb].getImpactCode();
					if (cType==null)
						cType = " ";
					if (cStatus==null)
						cStatus = " ";
					if (cDesc==null)
						cDesc = " ";
					if (cImpact==null)
						cImpact = " ";
					if ( (pType==null || pType.toUpperCase()==cType.toUpperCase()) && (pStatus==null || pStatus.toUpperCase()==cStatus.toUpperCase()) && (pDesc==null || pDesc.toUpperCase()==cDesc.toUpperCase()) && (pImpact==null || pImpact.toUpperCase()==cImpact.toUpperCase()) )
						{
						logMessage("Condition already exists: New condition not added to Address ID "+pAddrNum);
						logDebug("Condition already exists: New condition not added to Address ID "+pAddrNum);
						return false;
						}
					}
				}
			}
		var addCondResult = aa.addressCondition.addAddressCondition(pAddrNum, pType, pDesc, pComment, null, null, pImpact, pStatus, sysDate, null, sysDate, sysDate, systemUserObj, systemUserObj);
	  if (addCondResult.getSuccess())
		  {
			logMessage("Successfully added condition to Address ID " + pAddrNum + "  (" + pImpact + ") " + pDesc);
			logDebug("Successfully added condition to Address ID " + pAddrNum + "  (" + pImpact + ") " + pDesc);
			condAdded=true;
			}
		else
			{
			logDebug( "**ERROR: adding condition to Address " + pAddrNum + "  (" + pImpact + "): " + addCondResult.getErrorMessage());
			}
		}
	return condAdded;
	}


  function addToASITable(tableName,tableValues) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValues is an associative array of values.  All elements MUST be strings.
  	itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField();
	var col = tsm.getColumns();
	var fld_readonly = tsm.getReadonlyField(); //get ReadOnly property
	var coli = col.iterator();

	while (coli.hasNext())
		{
		colname = coli.next();


		//fld.add(tableValues[colname.getColumnName()]);
		fld.add(tableValues[colname.getColumnName()].fieldValue);
		fld_readonly.add(tableValues[colname.getColumnName()].readOnly);

		}

	tsm.setTableField(fld);

	tsm.setReadonlyField(fld_readonly); // set readonly field

	addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);
	if (!addResult .getSuccess())
		{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}


function allTasksComplete(stask) // optional tasks to ignore... for Sacramento
	{
	var ignoreArray = new Array();
	for (var i=1; i<arguments.length;i++)
		ignoreArray.push(arguments[i])

	// returns true if any of the subtasks are active
	var taskResult = aa.workflow.getTasks(capId);
	if (taskResult.getSuccess())
		{ taskArr = taskResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting tasks : " + taskResult.getErrorMessage()); return false }

	for (xx in taskArr)
		if (taskArr[xx].getProcessCode().equals(stask) && taskArr[xx].getActiveFlag().equals("Y") && !exists(taskArr[xx].getTaskDescription(),ignoreArray))
			return false;
	return true;
	}

function appHasCondition(pType,pStatus,pDesc,pImpact)
	{
	// Checks to see if conditions have been added to CAP
	// 06SSP-00223
	//
	if (pType==null)
		var condResult = aa.capCondition.getCapConditions(capId);
	else
		var condResult = aa.capCondition.getCapConditions(capId,pType);

	if (condResult.getSuccess())
		var capConds = condResult.getOutput();
	else
		{
		logMessage("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
		logDebug("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
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
	} //function

function appMatch(ats) // optional capId or CapID string
	{
	var matchArray = appTypeArray //default to current app
	if (arguments.length == 2)
		{
		matchCapParm = arguments[1]
		if (typeof(matchCapParm) == "string")
			matchCapId = aa.cap.getCapID(matchCapParm).getOutput();   // Cap ID to check
		else
			matchCapId = matchCapParm;
		if (!matchCapId)
			{
			logDebug("**WARNING: CapId passed to appMatch was not valid: " + arguments[1]);
			return false
			}
		matchCap = aa.cap.getCap(matchCapId).getOutput();
		matchArray = matchCap.getCapType().toString().split("/");
		}

	var isMatch = true;
	var ata = ats.split("/");
	if (ata.length != 4)
		logDebug("**ERROR in appMatch.  The following Application Type String is incorrectly formatted: " + ats);
	else
		for (xx in ata)
			if (!ata[xx].equals(matchArray[xx]) && !ata[xx].equals("*"))
				isMatch = false;
	return isMatch;
	}


function appNameIsUnique(gaGroup,gaType,gaName)
//
// returns true if gaName application name has not been used in CAPs of gaGroup and gaType
// Bypasses current CAP
	{
	var getCapResult = aa.cap.getByAppType(gaGroup,gaType);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()) ; return null }

	for (aps in apsArray)
		{
		var myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();
		if (myCap.getSpecialText())
			if (myCap.getSpecialText().toUpperCase().equals(gaName.toUpperCase()) && !capIDString.equals(apsArray[aps].getCapID().getCustomID()))
				return false;
		}
	return true;
	}


function assignCap(assignId) // option CapId
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	cd = cdScriptObj.getCapDetailModel();

	iNameResult  = aa.person.getUser(assignId);

	if (!iNameResult.getSuccess())
		{ logDebug("**ERROR retrieving  user model " + assignId + " : " + iNameResult.getErrorMessage()) ; return false ; }

	iName = iNameResult.getOutput();

	cd.setAsgnDept(iName.getDeptOfUser());
	cd.setAsgnStaff(assignId);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("Assigned CAP to " + assignId) }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}function assignInspection(iNumber,iName)
	{
	// updates the inspection and assigns to a new user
	// requires the inspection id and the user name
	//
	iObjResult = aa.inspection.getInspection(capId,iNumber);
	if (!iObjResult.getSuccess())
		{ logDebug("**ERROR retrieving inspection " + iNumber + " : " + iObjResult.getErrorMessage()) ; return false ; }

	iObj = iObjResult.getOutput();

	iNameResult  = aa.person.getUser(iName);

	if (!iNameResult.getSuccess())
		{ logDebug("**ERROR retrieving inspector user model " + iName + " : " + iNameResult.getErrorMessage()) ; return false ; }

	iInspector = iNameResult.getOutput();

	iObj.setInspector(iInspector);

	aa.inspection.editInspection(iObj)
	}

function assignTask(wfstr,username) // optional process name
	{
	// Assigns the task to a user.  No audit.
	//
	var useProcess = false;
	var processName = "";
	if (arguments.length == 3)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	var taskUserResult = aa.person.getUser(username);
	if (taskUserResult.getSuccess())
		taskUserObj = taskUserResult.getOutput();  //  User Object
	else
		{ logMessage("**ERROR: Failed to get user object: " + taskUserResult.getErrorMessage()); return false; }

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			fTask.setAssignedUser(taskUserObj);
			var taskItem = fTask.getTaskItem();
			var adjustResult = aa.workflow.assignTask(taskItem);

			logMessage("Assigned Workflow Task: " + wfstr + " to " + username);
			logDebug("Assigned Workflow Task: " + wfstr + " to " + username);
			}
		}
	}

function autoAssignInspection(iNumber)
	{
	// updates the inspection and assigns to a new user
	// requires the inspection id
	//

	iObjResult = aa.inspection.getInspection(capId,iNumber);
	if (!iObjResult.getSuccess())
		{ logDebug("**WARNING retrieving inspection " + iNumber + " : " + iObjResult.getErrorMessage()) ; return false ; }

	iObj = iObjResult.getOutput();


	inspTypeResult = aa.inspection.getInspectionType(iObj.getInspection().getInspectionGroup(), iObj.getInspectionType())

	if (!inspTypeResult.getSuccess())
		{ logDebug("**WARNING retrieving inspection Type " + inspTypeResult.getErrorMessage()) ; return false ; }

	inspTypeArr = inspTypeResult.getOutput();

        if (inspTypeArr == null || inspTypeArr.length == 0)
		{ logDebug("**WARNING no inspection type found") ; return false ; }

	inspType = inspTypeArr[0]; // assume first

	inspSeq = inspType.getSequenceNumber();

	inspSchedDate = iObj.getScheduledDate().getYear() + "-" + iObj.getScheduledDate().getMonth() + "-" + iObj.getScheduledDate().getDayOfMonth()

 	logDebug(inspSchedDate)

	iout =  aa.inspection.autoAssignInspector(capId.getID1(),capId.getID2(),capId.getID3(), inspSeq, inspSchedDate)

	if (!iout.getSuccess())
		{ logDebug("**WARNING retrieving auto assign inspector " + iout.getErrorMessage()) ; return false ; }

	inspectorArr = iout.getOutput();

	if (inspectorArr == null || inspectorArr.length == 0)
		{ logDebug("**WARNING no auto-assign inspector found") ; return false ; }

	inspectorObj = inspectorArr[0];  // assume first

	iObj.setInspector(inspectorObj);

	assignResult = aa.inspection.editInspection(iObj)

	if (!assignResult.getSuccess())
		{ logDebug("**ERROR re-assigning inspection " + assignResult.getErrorMessage()) ; return false ; }
	else
		logDebug("Successfully reassigned inspection " + iObj.getInspectionType() + " to user " + inspectorObj.getUserID());

	}
function branch(stdChoice)
	{
	doStandardChoiceActions(stdChoice,true,0);
	}

function branchTask(wfstr,wfstat,wfcomment,wfnote) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5)
		{
		processName = arguments[4]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	if (!wfstat) wfstat = "NA";

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"B");
			else
				aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"B");

			logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Branching...");
			logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Branching...");
			}
		}
	}

function callWebService(wsSubScript, wsScriptParameters)
	{

		aa.env.setValue("wsScriptParameters",wsScriptParameters);
		aa.env.setValue("wsScriptDebug","");
		aa.env.setValue("wsScriptMessage","");

		var sSubDebug = "";
		var sSubMessage = "";

		logDebug("Executing Web Service wsSubScript: " + wsSubScript);
		aa.runScriptInNewTransaction(wsSubScript);
		sSubDebug = aa.env.getValue("wsScriptDebug");
		sSubMessage = aa.env.getValue("wsScriptMessage");
		if (sSubDebug != "")
		{
			//Logging
			logDebug("Debug from wsSubScript: " + wsSubScript);
			logDebug(sSubDebug);
		}
		if (sSubMessage != "")
		{
			//Logging
			logDebug("Message from wsSubScript: " + wsSubScript);
			logDebug(sSubMessage);
		}

	}function capHasExpiredLicProf(pDateType, pLicType, pCapId)
	{
	//Checks if any licensed professional of specified type (optional) on CAP has expired,  Expiration date type specified by pDateType.
	//If any have expired, displays message and returns true.  If expiration date is on or before current date, it is expired.
	//If any date is blank, script assumes that date has not expired.
	//Uses functions: refLicProfGetDate, jsDateToMMDDYYYY(), matches()
	//SR5054B

	//Validate parameters
	var vDateType;
	if ( pDateType==null || pDateType=="" )
		{
		logDebug ("Invalid expiration type parameter");
		return false;
		}
	else
		{
		vDateType = pDateType.toUpperCase();
		if ( !matches(vDateType, "EXPIRE","INSURANCE","BUSINESS") )
			{
			logDebug ("Invalid expiration type parameter");
			return false;
			}
		}
	var vCapId = pCapId;
	if ( pCapId==null || pCapId=="" ) //If no capid parameter, use current cap
		vCapId = capId;

	//get Licensed Profs on CAP
	var licProfResult = aa.licenseScript.getLicenseProf(capId);
	if (!licProfResult.getSuccess())
		{
		logDebug("Error getting CAP's license professional: " +licProfResult.getErrorMessage());
		return false;
		}
	var vToday = new Date();
	var vExpired = false;
	var licProfList = licProfResult.getOutput();
	if (licProfList)
		{
		for (i in licProfList)
			{
			if ( pLicType==null || pLicType=="" || pLicType.equals(licProfList[i].getLicenseType()) )
				{
				var licNum = licProfList[i].getLicenseNbr();

				//Check if has expired
				var vResult = refLicProfGetDate(licNum, vDateType);

				if (vResult < vToday)
					{
					vExpired = true;
					logMessage("WARNING: Licence # "+licNum+" expired on "+jsDateToMMDDYYYY(vResult));
					logDebug("Licence # "+licNum+" expired on "+jsDateToMMDDYYYY(vResult));
					}
				}
			}
		}
	else
		{
		logDebug("No licensed professionals found on CAP");
		return false;
		}
	return vExpired;
	}function capIdsFilterByFileDate(pCapIdArray, pStartDate, pEndDate)
	{
	//Filters CAP's in pCapIdArray by file date, and returns only CAP's whose file date falls within pStartDate and pEndDate, as a capId Array
	//Parameter pCapIdArray must be array of capId's (CapIDModel objects)
	//07SSP-00034/SP5015

	if (pCapIdArray.length==0 || pCapIdArray[0]==undefined)
		{
		logDebug("Invalid 1st parameter");
		return false;
		}

	var filteredArray = new Array();
	var startDate = new Date(pStartDate);
	var endDate = new Date(pEndDate);
	var relcap;
	var fileDate;

	logDebug("Filtering CAP array by file date between "+pStartDate+" and "+pEndDate);
	for (y in pCapIdArray)
		{
		relcap = aa.cap.getCap(pCapIdArray[y]).getOutput(); //returns CapScriptModel object
		fileDate = convertDate(relcap.getFileDate()); //returns javascript date
		//logDebug("CAP: "+pCapIdArray[y]+", File Date: "+fileDate);
		if (fileDate >= startDate && fileDate <= endDate)
			filteredArray.push(pCapIdArray[y]); //add cap to array
		}

	return filteredArray;
	}function capIdsGetByAddr ()
	{
	//Gets CAPs with the same address as the current CAP, as capId (CapIDModel) object array (array includes current capId)
	//07SSP-00034/SP5015
	//

	//Get address(es) on current CAP
	var addrResult = aa.address.getAddressByCapId(capId);
	if (!addrResult.getSuccess())
		{
		logDebug("**ERROR: getting CAP addresses: "+addrResult.getErrorMessage());
		return false;
		}

	var addrArray = new Array();
	var addrArray = addrResult.getOutput();
	if (addrArray.length==0 || addrArray==undefined)
		{
		logDebug("The current CAP has no address.  Unable to get CAPs with the same address.")
		return false;
		}

	//use 1st address for comparison
	var streetName = addrArray[0].getStreetName();
	var hseNum = addrArray[0].getHouseNumberStart();
	var streetSuffix = addrArray[0].getStreetSuffix();
	var zip = addrArray[0].getZip();
	var streetDir = addrArray[0].getStreetDirection();

	if (streetDir == "") streetDir = null;
	if (streetSuffix == "") streetSuffix = null;
	if (zip == "") zip = null;

	// get caps with same address
	var capAddResult = aa.cap.getCapListByDetailAddress(streetName,parseInt(hseNum),streetSuffix,zip,streetDir,null);
	if (capAddResult.getSuccess())
	 	var capArray=capAddResult.getOutput();
	else
	 	{
		logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());
		return false;
		}

	var capIdArray = new Array();
	//convert CapIDScriptModel objects to CapIDModel objects
	for (i in capArray)
		capIdArray.push(capArray[i].getCapID());

	if (capIdArray)
		return (capIdArray);
	else
		return false;
	}function capIdsGetByParcel(pParcelNum)
	{
	//Gets CAPs that have parcel pParcelNum, as capId (CapIDModel object)  array (array includes current capId)
	//if parameter pParcelNum is null, uses 1st parcel on current CAP
	//07SSP-00034/SP5015
	//
	if (pParcelNum != null)
		var parcelNum = pParcelNum;
	else
		{
		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (!capParcelResult.getSuccess())
			{
			logDebug("**ERROR: Failed to get parcels: " + capParcelResult.getErrorMessage());
			return false;
			}

		var Parcels = capParcelResult.getOutput().toArray();
		if (Parcels[0]==undefined)
			{
			logDebug("Current CAP has no parcel");
			return false;
			}
		var parcelNum = Parcels[0].getParcelNumber();
		}

	capParcelResult = aa.cap.getCapListByParcelID(parcelNum, aa.util.newQueryFormat());

	if (!capParcelResult.getSuccess())
		{
		logDebug("**ERROR: Failed to get parcels: " + capParcelResult.getErrorMessage());
		return false;
		}

	var capParArray = capParcelResult.getOutput();
	var capIdParArray = new Array();
	//convert CapIDScriptModel objects to CapIDModel objects
	for (i in capParArray)
		capIdParArray.push(capParArray[i].getCapID());

	if (capIdParArray)
		return capIdParArray;
	else
		return false;
	}

	function checkInspectionResult(insp2Check,insp2Result)
	{
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && String(insp2Result).equals(inspList[xx].getInspectionStatus()))
				return true;
		}
	return false;
	}

function childGetByCapType(pCapType, pParentCapId)
	{
	// Returns capId object of first child of pParentCapId whose cap type matches pCapType parameter
	// Wildcard * may be used in pCapType, e.g. "Building/Commercial/*/*"
	// Optional 3rd parameter pChildCapIdSkip: capId of child to skip
	// 06SSP-00219.C61201
  //
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
	if (getCapResult.getSuccess())
		{
		var childArray = getCapResult.getOutput();
		if (childArray.length)
			{
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
						break;
						}
					}
				if (isMatch)
					return childCapId;
				}
			}
		else
			logDebug( "**WARNING: childGetByCapType function found no children");

		return false;
		}
	else
		logDebug( "**WARNING: childGetByCapType function found no children: " + getCapResult.getErrorMessage());
	}

function closeTask(wfstr,wfstat,wfcomment,wfnote) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5)
		{
		processName = arguments[4]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	if (!wfstat) wfstat = "NA";

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");
			else
				aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"Y");

			logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat);
			logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat);
			}
		}
	}

function comment(cstr)
	{
	if (showDebug) logDebug(cstr);
	if (showMessage) logMessage(cstr);
	}

function contactAddFromUser(pUserId)
	{
	// Retrieves user's reference Contact record and adds to CAP
	// Returns contact seq nbr or false if contact not added
	// 06SSP-00186
	//
	if (arguments.length==1) //use parameter user
		{
		var personResult = aa.person.getUser(pUserId);
		if (personResult.getSuccess())
			{
			var personObj = personResult.getOutput();
			//logDebug("personObj class: "+personObj.getClass());
			if (personObj==null) // no user found
				{
				logDebug("**ERROR: Failed to get User");
				return false;
				}
			}
		else
  	  {
			logDebug("**ERROR: Failed to get User: " + personResult.getErrorMessage());
			return false;
			}
		}
	else //use current user
		var personObj = systemUserObj;

	var userFirst = personObj.getFirstName();
	var userMiddle = personObj.getMiddleName();
	var userLast = personObj.getLastName();

	//Find PeopleModel object for user
	var peopleResult = aa.people.getPeopleByFMLName(userFirst, userMiddle, userLast);
	if (peopleResult.getSuccess())
		{
		var peopleObj = peopleResult.getOutput();
		//logDebug("peopleObj is "+peopleObj.getClass());
		if (peopleObj==null)
			{
			logDebug("No reference user found.");
			return false;
			}
		logDebug("No. of reference contacts found: "+peopleObj.length);
		}
	else
		{
			logDebug("**ERROR: Failed to get reference contact record: " + peopleResult.getErrorMessage());
			return false;
		}

	//Add the reference contact record to the current CAP
	var contactAddResult = aa.people.createCapContactWithRefPeopleModel(capId, peopleObj[0]);
	if (contactAddResult.getSuccess())
		{
		logDebug("Contact successfully added to CAP.");
		var capContactResult = aa.people.getCapContactByCapID(capId);
		if (capContactResult.getSuccess())
			{
			var Contacts = capContactResult.getOutput();
			var idx = Contacts.length;
			var contactNbr = Contacts[idx-1].getCapContactModel().getPeople().getContactSeqNumber();
			logDebug ("Contact Nbr = "+contactNbr);
			return contactNbr;
			}
		else
			{
			logDebug("**ERROR: Failed to get Contact Nbr: "+capContactResult.getErrorMessage());
			return false;
			}
		}
	else
		{
			logDebug("**ERROR: Cannot add contact: " + contactAddResult.getErrorMessage());
			return false;
		}
	}

function contactSetPrimary(pContactNbr)
	{
	// Makes contact the Primary Contact
	// 06SSP-00186
	//
	if (pContactNbr==null)
		{
		logDebug("**ERROR: ContactNbr parameter is null");
		return false;
		}
	else
		{
		var capContactResult = aa.people.getCapContactByPK(capId, pContactNbr);
		if (capContactResult.getSuccess())
			{
			var contact = capContactResult.getOutput();
			//logDebug("contact class is "+contact.getClass());
			var peopleObj=contact.getCapContactModel().getPeople();
			peopleObj.setFlag("Y");
			contact.getCapContactModel().setPeople(peopleObj);
			var editResult = aa.people.editCapContact(contact.getCapContactModel());
			if (editResult.getSuccess())
				{
				logDebug("Contact successfully set to Primary");
				return true;
				}
			else
				{
				logDebug("**ERROR: Could not set contact to Primary: "+editResult.getErrorMessage());
				return false;
				}
			}
		else
			{
			logDebug("**ERROR: Can't get contact: "+capContactResult.getErrorMessage());
			return false;
			}
		}
	}

function contactSetRelation(pContactNbr, pRelation)
	{
	// Edits Contact Relationship for specified Contact
	//06SSP-00186
	//
	if (pContactNbr==null)
		{
		logDebug("ContactNbr parameter is null");
		return false;
		}
	else
		{
		var capContactResult = aa.people.getCapContactByPK(capId, pContactNbr);
		if (capContactResult.getSuccess())
			{
			var contact = capContactResult.getOutput();
			//logDebug("contact class is "+contact.getClass());
			var peopleObj=contact.getCapContactModel().getPeople();
			peopleObj.setRelation(pRelation);
			contact.getCapContactModel().setPeople(peopleObj);
			var editResult = aa.people.editCapContact(contact.getCapContactModel());
			if (editResult.getSuccess())
				{
				logDebug("Contact relationship successfully changed to "+pRelation);
				return true;
				}
			else
				{
				logDebug("**ERROR: Could not change contact relationship: "+editResult.getErrorMessage());
				return false;
				}
			}
		else
			{
			logDebug("**ERROR: Can't get contact: "+capContactResult.getErrorMessage());
			return false;
			}
		}
	}

function copyAddresses(pFromCapId, pToCapId)
	{
	//Copies all property addresses from pFromCapId to pToCapId
	//If pToCapId is null, copies to current CAP
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	//check if target CAP has primary address
	var priAddrExists = false;
	var capAddressResult = aa.address.getAddressByCapId(vToCapId);
	if (capAddressResult.getSuccess())
		{
		Address = capAddressResult.getOutput();
		for (yy in Address)
			{
			if ("Y"==Address[yy].getPrimaryFlag())
				{
				priAddrExists = true;
				logDebug("Target CAP has primary address");
				break;
				}
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
		return false;
		}

	//get addresses from originating CAP
	var capAddressResult = aa.address.getAddressWithAttributeByCapId(pFromCapId);
	var copied = 0;
	if (capAddressResult.getSuccess())
		{
		Address = capAddressResult.getOutput();
		for (yy in Address)
			{
			newAddress = Address[yy];
			newAddress.setCapID(vToCapId);
			if (priAddrExists)
				newAddress.setPrimaryFlag("N"); //prevent target CAP from having more than 1 primary address
			aa.address.createAddressWithAPOAttribute(vToCapId, newAddress);
			logDebug("Copied address from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
			copied++;
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get addresses: " + capAddressResult.getErrorMessage());
		return false;
		}
	return copied;
	}



function copyCalcVal(newcap)
	{
	if (!newcap)
		{ logMessage("**WARNING: copyCalcVal was passed a null new cap ID"); return false; }

	var valResult = aa.finance.getCalculatedValuation(capId,null);
	if (valResult.getSuccess())
		var valArray = valResult.getOutput();
	else
		{ logMessage("**ERROR: Failed to get calc val array: " + valResult.getErrorMessage()); return false; }

	for (thisCV in valArray)
		{
		var bcv = valArray[thisCV].getbCalcValuatn();
		bcv.setCapID(newcap);
		createResult = aa.finance.createBCalcValuatn(bcv);
		if (!createResult.getSuccess())
			{ logMessage("**ERROR: Creating new calc valuatn on target cap ID: " + createResult.getErrorMessage()); return false; }
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

function copyConditionsFromParcel(parcelIdString)
		{
		var getFromCondResult = aa.parcelCondition.getParcelConditions(parcelIdString)
		if (getFromCondResult.getSuccess())
			var condA = getFromCondResult.getOutput();
		else
			{ logDebug( "**WARNING: getting parcel conditions: " + getFromCondResult.getErrorMessage()) ; return false}

		for (cc in condA)
			{
			var thisC = condA[cc];

			if (!appHasCondition(thisC.getConditionType(),null,thisC.getConditionDescription(),thisC.getImpactCode()))
				{
				var addCapCondResult = aa.capCondition.addCapCondition(capId, thisC.getConditionType(), thisC.getConditionDescription(), thisC.getConditionComment(), thisC.getEffectDate(), thisC.getExpireDate(), sysDate, thisC.getRefNumber1(),thisC.getRefNumber2(), thisC.getImpactCode(), thisC.getIssuedByUser(), thisC.getStatusByUser(), thisC.getConditionStatus(), currentUserID, "A")
				if (addCapCondResult.getSuccess())
					logDebug("Successfully added condition (" +  thisC.getImpactCode() + ") " +  thisC.getConditionDescription());
				else
					logDebug( "**ERROR: adding condition (" + thisC.getImpactCode() + "): " + addCapCondResult.getErrorMessage());
				}
			else
				logDebug( "**WARNING: adding condition (" + thisC.getImpactCode() + "): condition already exists");

			}
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
function copyParcelGisObjects()
	{
	var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
	if (capParcelResult.getSuccess())
		{
		var Parcels = capParcelResult.getOutput().toArray();
		for (zz in Parcels)
			{
			var ParcelValidatedNumber = Parcels[zz].getParcelNumber();
			logDebug("Looking at parcel " + ParcelValidatedNumber);
			var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
			if (gisObjResult.getSuccess())
				var fGisObj = gisObjResult.getOutput();
			else
				{ logDebug("**ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

			for (a1 in fGisObj) // for each GIS object on the Cap
				{
				var gisTypeScriptModel = fGisObj[a1];
                                var gisObjArray = gisTypeScriptModel.getGISObjects()
                                for (b1 in gisObjArray)
                                	{
  					var gisObjScriptModel = gisObjArray[b1];
  					var gisObjModel = gisObjScriptModel.getGisObjectModel() ;

					var retval = aa.gis.addCapGISObject(capId,gisObjModel.getServiceID(),gisObjModel.getLayerId(),gisObjModel.getGisId());

					if (retval.getSuccess())
						{ logDebug("Successfully added Cap GIS object: " + gisObjModel.getGisId())}
					else
						{ logDebug("**ERROR: Could not add Cap GIS Object.  Reason is: " + retval.getErrorType() + ":" + retval.getErrorMessage()) ; return false }
					}
				}
			}
		}
	else
		{ logDebug("**ERROR: Getting Parcels from Cap.  Reason is: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage()) ; return false }
	}

function copyParcels(pFromCapId, pToCapId)
	{
	//Copies all parcels from pFromCapId to pToCapId
	//If pToCapId is null, copies to current CAP
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var capParcelResult = aa.parcel.getParcelandAttribute(pFromCapId,null);
	var copied = 0;
	if (capParcelResult.getSuccess())
		{
		var Parcels = capParcelResult.getOutput().toArray();
		for (zz in Parcels)
			{
			var newCapParcel = aa.parcel.getCapParcelModel().getOutput();
			newCapParcel.setParcelModel(Parcels[zz]);
			newCapParcel.setCapIDModel(vToCapId);
			newCapParcel.setL1ParcelNo(Parcels[zz].getParcelNumber());
			newCapParcel.setParcelNo(Parcels[zz].getParcelNumber());
			aa.parcel.createCapParcel(newCapParcel);
			logDebug("Copied parcel "+Parcels[zz].getParcelNumber()+" from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
			copied++;
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get parcels: " + capParcelResult.getErrorMessage());
		return false;
		}
	return copied;
	}function copySchedInspections(pFromCapId, pToCapId)
	{
	//Copies all scheduled inspections from pFromCapId to pToCapId
	//If pToCapId is null, copies to current CAP
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var inspResultObj = aa.inspection.getInspections(pFromCapId);

	if (!inspResultObj.getSuccess())
		{
		logMessage("**ERROR: Failed to get inspections: " + inspResultObj.getErrorMessage());
		return false;
		}

	var inspCount = 0;
	var schedRes;
	var inspector;
	var inspDate;
	var inspTime;
	var inspType;
	var inspComment;

	var inspList = inspResultObj.getOutput();
	for (xx in inspList)
		{
		if ("Insp Scheduled"==inspList[xx].getDocumentDescription())
			{
			inspector = inspList[xx].getInspector();
			inspDate = inspList[xx].getScheduledDate();
			inspTime = inspList[xx].getScheduledTime();
			inspType = inspList[xx].getInspectionType();
			inspComment = inspList[xx].getInspectionComments();
			schedRes = aa.inspection.scheduleInspection(vToCapId, inspector, inspDate, inspTime, inspType, inspComment);
			if (schedRes.getSuccess())
				{
				logDebug("Copied scheduled inspection from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
				inspCount++;
				}
			else
				logDebug( "**ERROR: copying scheduling inspection (" + inspType + "): " + schedRes.getErrorMessage());
			}
		}
	return inspCount;
	}


function countActiveTasks(processName)
	{
	// counts the number of active tasks on a given process
        var numOpen = 0;

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		fTask = wfObj[i];
		if (fTask.getProcessCode().equals(processName))
			if (fTask.getActiveFlag().equals("Y"))
				numOpen++;
		}
	return numOpen;
	}

function countIdenticalInspections()
	{
	var cntResult = 0;
	var oldDateStr = "01/01/1900";  // inspections older than this date count as 1
	if (arguments.length > 0) oldDateStr = arguments[0]; // Option to override olddate in the parameter
	oldDate = new Date("oldDateStr");

	var oldInspectionFound = false;
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		for (xx in inspList)
			{
			if (String(inspType).equals(inspList[xx].getInspectionType()) && String(inspResult).equals(inspList[xx].getInspectionStatus()))
				{
				if (convertDate(inspList[xx].getInspectionStatusDate()) < oldDate)
					{
					if (!oldInspectionFound) { cntResult++ ; oldInspectionFound = true }
					}
				else
					{
					cntResult++
					}
				}
			}
		}
	logDebug("countIdenticalInspections(" + inspType + "," + inspResult + ", " + oldDateStr +  ") Returns " + cntResult);
	return cntResult;
	}
	function createCap(pCapType, pAppName)
	{
	// creates a new application and returns the capID object
	// 07SSP-00037/SP5017
	//
	var aCapType = pCapType.split("/");
	if (aCapType.length != 4)
		{
		logDebug("**ERROR in createCap.  The following Application Type String is incorrectly formatted: " + pCapType);
		return ("INVALID PARAMETER");
		}

	var appCreateResult = aa.cap.createApp(aCapType[0],aCapType[1],aCapType[2],aCapType[3],pAppName);
	logDebug("Creating cap " + pCapType);

	if (!appCreateResult.getSuccess())
		{
		logDebug( "**ERROR: creating CAP " + appCreateResult.getErrorMessage());
		return false;
		}

	var newId = appCreateResult.getOutput();
	logDebug("CAP of type " + pCapType + " created successfully ");
	var newObj = aa.cap.getCap(newId).getOutput();	//Cap object

	return newId;
	}

function createChild(grp,typ,stype,cat,desc)
//
// creates the new application and returns the capID object
//
	{
	var appCreateResult = aa.cap.createApp(grp,typ,stype,cat,desc);
	logDebug("creating cap " + grp + "/" + typ + "/" + stype + "/" + cat);
	if (appCreateResult.getSuccess())
		{
		var newId = appCreateResult.getOutput();
		logDebug("cap " + grp + "/" + typ + "/" + stype + "/" + cat + " created successfully ");

		// create Detail Record
		capModel = aa.cap.newCapScriptModel().getOutput();
		capDetailModel = capModel.getCapModel().getCapDetailModel();
		capDetailModel.setCapID(newId);
		aa.cap.createCapDetail(capDetailModel);

		var newObj = aa.cap.getCap(newId).getOutput();	//Cap object
		var result = aa.cap.createAppHierarchy(capId, newId);
		if (result.getSuccess())
			logDebug("Child application successfully linked");
		else
			logDebug("Could not link applications");

		// Copy Parcels

		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (capParcelResult.getSuccess())
			{
			var Parcels = capParcelResult.getOutput().toArray();
			for (zz in Parcels)
				{
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
		if (capContactResult.getSuccess())
			{
			Contacts = capContactResult.getOutput();
			for (yy in Contacts)
				{
				var newContact = Contacts[yy].getCapContactModel();
				newContact.setCapID(newId);
				aa.people.createCapContact(newContact);
				logDebug("added contact");
				}
			}

		// Copy Addresses
		capAddressResult = aa.address.getAddressByCapId(capId);
		if (capAddressResult.getSuccess())
			{
			Address = capAddressResult.getOutput();
			for (yy in Address)
				{
				newAddress = Address[yy];
				newAddress.setCapID(newId);
				aa.address.createAddress(newAddress);
				logDebug("added address");
				}
			}

		return newId;
		}
	else
		{
		logDebug( "**ERROR: adding child App: " + appCreateResult.getErrorMessage());
		}
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

	//newLic.setContactFirstName(cont.getFirstName());
	//newLic.setContactMiddleName(cont.getMiddleName());  //method not available
	//newLic.setContactLastName(cont.getLastName());
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


function createRefLicProfFromLicProf()
	{
	//
	// Get the lic prof from the app
	//
	capLicenseResult = aa.licenseScript.getLicenseProf(capId);
	if (capLicenseResult.getSuccess())
		{ capLicenseArr = capLicenseResult.getOutput();  }
	else
		{ logDebug("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); return false; }

	if (!capLicenseArr.length)
		{ logDebug("WARNING: no license professional available on the application:"); return false; }

	licProfScriptModel = capLicenseArr[0];
	rlpId = licProfScriptModel.getLicenseNbr();
	//
	// Now see if a reference version exists
	//
	var updating = false;

	var newLic = getRefLicenseProf(rlpId)

	if (newLic)
		{
		updating = true;
		logDebug("Updating existing Ref Lic Prof : " + rlpId);
		}
	else
		var newLic = aa.licenseScript.createLicenseScriptModel();

	//
	// Now add / update the ref lic prof
	//
	newLic.setStateLicense(rlpId);
	newLic.setAddress1(licProfScriptModel.getAddress1());
	newLic.setAddress2(licProfScriptModel.getAddress2());
	newLic.setAddress3(licProfScriptModel.getAddress3());
	newLic.setAgencyCode(licProfScriptModel.getAgencyCode());
	newLic.setAuditDate(licProfScriptModel.getAuditDate());
	newLic.setAuditID(licProfScriptModel.getAuditID());
	newLic.setAuditStatus(licProfScriptModel.getAuditStatus());
	newLic.setBusinessLicense(licProfScriptModel.getBusinessLicense());
	newLic.setBusinessName(licProfScriptModel.getBusinessName());
	newLic.setCity(licProfScriptModel.getCity());
	newLic.setCityCode(licProfScriptModel.getCityCode());
	//newLic.setContactFirstName(licProfScriptModel.getContactFirstName());
	//newLic.setContactLastName(licProfScriptModel.getContactLastName());
	//newLic.setContactMiddleName(licProfScriptModel.getContactMiddleName());
	newLic.setContryCode(licProfScriptModel.getCountryCode());
	newLic.setCountry(licProfScriptModel.getCountry());
	newLic.setEinSs(licProfScriptModel.getEinSs());
	newLic.setEMailAddress(licProfScriptModel.getEmail());
	newLic.setFax(licProfScriptModel.getFax());
	newLic.setLicenseType(licProfScriptModel.getLicenseType());
	newLic.setLicOrigIssDate(licProfScriptModel.getLicesnseOrigIssueDate());
	newLic.setPhone1(licProfScriptModel.getPhone1());
	newLic.setPhone2(licProfScriptModel.getPhone2());
	newLic.setSelfIns(licProfScriptModel.getSelfIns());
	newLic.setState(licProfScriptModel.getState());
	newLic.setLicState(licProfScriptModel.getState());
	newLic.setSuffixName(licProfScriptModel.getSuffixName());
	newLic.setWcExempt(licProfScriptModel.getWorkCompExempt());
	newLic.setZip(licProfScriptModel.getZip());

	if (updating)
		myResult = aa.licenseScript.editRefLicenseProf(newLic);
	else
		myResult = aa.licenseScript.createRefLicenseProf(newLic);

	if (myResult.getSuccess())
		{
		logDebug("Successfully added/updated License ID : " + rlpId)
		return rlpId;
		}
	else
		{ logDebug("**ERROR: can't create ref lic prof: " + myResult.getErrorMessage()); }
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

function dateNextOccur (pMonth, pDay, pDate)
	//optional 4th param pOddEven:
	//'ODD' specifies that return date must be next odd year, 'EVEN' means return date is next even year.
	//allows wfDate variable to be used as pDate parameter
	{
	var vDate = new String(pDate);
	if (vDate.length==10 && vDate.indexOf("-")==4 && vDate.indexOf("-",7)==7) //is format YYYY-MM-DD
		var vBaseDate = new Date(vDate.substr(5,2)+"/"+vDate.substr(8,2)+"/"+vDate.substr(0,4));
	else
		var vBaseDate = new Date(vDate);

	var vCurrentYr = vBaseDate.getFullYear().toString();
	var vTestDate = new Date(pMonth+"/"+pDay+"/"+vCurrentYr);
	var vUseOddEven = false;
	var vOddEven;
	var vReturnDate = vTestDate;
	if (arguments.length>3) //optional 4th parameter is used
		{
		var vOddEven = arguments[3].toUpperCase(); //return odd or even year
		vUseOddEven = true;
		}

	if (vTestDate > vBaseDate)
		vReturnDate = vTestDate;
	else
		{
		vTestDate.setFullYear(vTestDate.getFullYear()+1);
		vReturnDate = vTestDate;
		}

	if (vUseOddEven) // use next ODD or EVEN year
		{
		if (vOddEven=="ODD" && vReturnDate.getFullYear()%2==0) //vReturnDate is EVEN year
			vReturnDate.setFullYear(vReturnDate.getFullYear()+1);

		if (vOddEven=="EVEN" && vReturnDate.getFullYear()%2)    //vReturnDate is ODD year
			vReturnDate.setFullYear(vReturnDate.getFullYear()+1);
		}

	return (vReturnDate.getMonth()+1) + "/" + vReturnDate.getDate() + "/" + vReturnDate.getFullYear();
	}

function deactivateTask(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			var completeFlag = fTask.getCompleteFlag();

			if (useProcess)
				aa.workflow.adjustTask(capId, stepnumber, processID, "N", completeFlag, null, null)
			else
				aa.workflow.adjustTask(capId, stepnumber, "N", completeFlag, null, null)

			logMessage("deactivating Workflow Task: " + wfstr);
			logDebug("deactivating Workflow Task: " + wfstr);
			}
		}
	}

function editAppName(newname)
	{
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	capResult = aa.cap.getCap(capId)

	if (!capResult.getSuccess())
		{logDebug("**WARNING: error getting cap : " + capResult.getErrorMessage()) ; return false }

	capModel = capResult.getOutput().getCapModel()

	capModel.setSpecialText(newname)

	setNameResult = aa.cap.editCapByPK(capModel)

	if (!setNameResult.getSuccess())
		{ logDebug("**WARNING: error setting cap name : " + setNameResult.getErrorMessage()) ; return false }


	return true;
	}

function editAppSpecific(itemName,itemValue)  // optional: itemCap
	{
	var updated = false;
	var i=0;
	itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

   	if (itemCap == null)
	   {
	   logDebug("Can't copy " + itemName + " to child application, child App ID is null");  return false;
	   }

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
				while (i < appspecObj.length && !updated)
				{
					if (appspecObj[i].getCheckboxDesc() == itemName && (!useAppSpecificGroupName || appspecObj[i].getCheckboxType() == itemGroup))
					{
						appspecObj[i].setChecklistComment(itemValue);
						var actionResult = aa.appSpecificInfo.editAppSpecInfos(appspecObj);
						if (actionResult.getSuccess()) {
							logMessage("app spec info item " + itemName + " has been given a value of " + itemValue);
							logDebug("app spec info item " + itemName + " has been given a value of " + itemValue);
						} else {
							logDebug("**ERROR: Setting the app spec info item " + itemName + " to " + itemValue + " .\nReason is: " +   actionResult.getErrorType() + ":" + actionResult.getErrorMessage());
						}
						updated = true;
						AInfo[itemName] = itemValue;  // Update array used by this script
					}
					i++;
				} // while loop
			} // item name blank
		} // got app specific object
	}


function editRefLicProfAttribute(pLicNum,pAttributeName,pNewAttributeValue)
	{

	var attrfound = false;
	var oldValue = null;

	licObj = getRefLicenseProf(pLicNum)

	if (!licObj)
		{ logDebug("**WARNING Licensed Professional : " + pLicNum + " not found") ; return false }

	licSeqNum = licObj.getLicSeqNbr();
	attributeType = licObj.getLicenseType();

	if (licSeqNum==0 || licSeqNum==null || attributeType=="" || attributeType==null)
		{ logDebug("**WARNING Licensed Professional Sequence Number or Attribute Type missing") ; return false }

	var peopAttrResult = aa.people.getPeopleAttributeByPeople(licSeqNum, attributeType);

	if (!peopAttrResult.getSuccess())
		{ logDebug("**WARNING retrieving reference license professional attribute: " + peopAttrResult.getErrorMessage()); return false }

	var peopAttrArray = peopAttrResult.getOutput();

	for (i in peopAttrArray)
		{
		if ( pAttributeName.equals(peopAttrArray[i].getAttributeName()))
			{
			oldValue = peopAttrArray[i].getAttributeValue()
			attrfound = true;
			break;
			}
		}

	if (attrfound)
		{
		logDebug("Updated Ref Lic Prof: " + pLicNum + ", attribute: " + pAttributeName + " from: " + oldValue + " to: " + pNewAttributeValue)
		peopAttrArray[i].setAttributeValue(pNewAttributeValue);
		aa.people.editPeopleAttribute(peopAttrArray[i].getPeopleAttributeModel());
		}
	else
		{
		logDebug("**WARNING attribute: " + pAttributeName + " not found for Ref Lic Prof: "+ pLicNum)
		/* make a new one with the last model.  Not optimal but it should work
		newPAM = peopAttrArray[i].getPeopleAttributeModel();
		newPAM.setAttributeName(pAttributeName);
		newPAM.setAttributeValue(pNewAttributeValue);
		newPAM.setAttributeValueDataType("Number");
		aa.people.createPeopleAttribute(newPAM);
		*/
		}
	}function editTaskComment(wfstr,wfcomment) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 3)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		fTask = wfObj[i];
  		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			wfObj[i].setDispositionComment(wfcomment);
			var fTaskModel = wfObj[i].getTaskItem();
			var tResult = aa.workflow.adjustTaskWithNoAudit(fTaskModel);
			if (tResult.getSuccess())
				logDebug("Set Workflow: " + wfstr + " comment " + wfcomment);
		  	else
	  	  		{ logMessage("**ERROR: Failed to update comment on workflow task: " + tResult.getErrorMessage()); return false; }
			}
		}
	}

function editTaskDueDate(wfstr,wfdate) // optional process name.  if wfstr == "*", set for all tasks
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 3)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*")  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			wfObj[i].setDueDate(aa.date.parseDate(wfdate));
			var fTaskModel = wfObj[i].getTaskItem();
			var tResult = aa.workflow.adjustTaskWithNoAudit(fTaskModel);
			if (tResult.getSuccess())
				logDebug("Set Workflow Task: " + fTask.getTaskDescription() + " due Date " + wfdate);
		  	else
	  	  		{ logMessage("**ERROR: Failed to update due date on workflow: " + tResult.getErrorMessage()); return false; }
			}
		}
	}

function editTaskSpecific(wfName,itemName,itemValue)  // optional: itemCap
	{
	var updated = false;
	var i=0;
	itemCap = capId;
	if (arguments.length == 4) itemCap = arguments[3]; // use cap ID specified in args
	//
 	// Get the workflows
 	//
 	var workflowResult = aa.workflow.getTasks(itemCap);
 	if (workflowResult.getSuccess())
 		wfObj = workflowResult.getOutput();
 	else
 		{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

 	//
 	// Loop through workflow tasks
 	//
 	for (i in wfObj)
 		{
 		fTask = wfObj[i];
 		stepnumber = fTask.getStepNumber();
 		processID = fTask.getProcessID();
 		if (wfName.equals(fTask.getTaskDescription())) // Found the right Workflow Task
 			{
  		TSIResult = aa.taskSpecificInfo.getTaskSpecifiInfoByDesc(itemCap,processID,stepnumber,itemName);
 			if (TSIResult.getSuccess())
 				{
	 			var TSI = TSIResult.getOutput();
				if (TSI != null)
					{
					var TSIArray = new Array();
					TSInfoModel = TSI.getTaskSpecificInfoModel();
					TSInfoModel.setChecklistComment(itemValue);
					TSIArray.push(TSInfoModel);
					TSIUResult = aa.taskSpecificInfo.editTaskSpecInfos(TSIArray);
					if (TSIUResult.getSuccess())
						{
						logDebug("Successfully updated TSI Task=" + wfName + " Item=" + itemName + " Value=" + itemValue);
						AInfo[itemName] = itemValue;  // Update array used by this script
						}
					else
						{ logDebug("**ERROR: Failed to Update Task Specific Info : " + TSIUResult.getErrorMessage()); return false; }
					}
				else
					logDebug("No task specific info field called "+itemName+" found for task "+wfName);
	 			}
	 		else
	 			{
	 			logDebug("**ERROR: Failed to get Task Specific Info objects: " + TSIUResult.getErrorMessage());
	 			return false;
	 			}
	 		}  // found workflow task
		} // each task
	}

function email(pToEmail, pFromEmail, pSubject, pText)
	{
	//Sends email to specified address
	//06SSP-00221
	//
	aa.sendMail(pFromEmail, pToEmail, "", pSubject, pText);
	logDebug("Email sent to "+pToEmail);
	return true;
	}

function emailContact(mSubj,mText)   // optional: Contact Type, default Applicant
	{
	var replyTo = "noreply@accela.com";
	var contactType = "Applicant"
	var emailAddress = "";

	if (arguments.length == 3) contactType = arguments[2]; // use contact type specified

	var capContactResult = aa.people.getCapContactByCapID(capId);
	if (capContactResult.getSuccess())
		{
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts)
			if (contactType.equals(Contacts[yy].getCapContactModel().getPeople().getContactType()))
				if (Contacts[yy].getEmail() != null)
					emailAddress = Contacts[yy].getEmail();
		}

	if (emailAddress.length)
		{
		aa.sendMail(replyTo, emailAddress, "", mSubj, mText);
		logDebug("Successfully sent email to " + contactType);
		}
	else
		logDebug("Couldn't send email to " + contactType + ", no email address");
	}

function feeAmount(feestr)
	{
	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if (feestr.equals(feeObjArr[ff].getFeeCod()))
			feeTotal+=feeObjArr[ff].getFee()

	return feeTotal;
	}


function feeBalance(feestr)
	{
	// Searches payment fee items and returns the unpaid balance of a fee item
	// Sums fee items if more than one exists.  Optional second parameter fee schedule
	var amtFee = 0;
	var amtPaid = 0;
	var feeSch;

	if (arguments.length == 2) feeSch = arguments[1];

	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if ((!feestr || feestr.equals(feeObjArr[ff].getFeeCod())) && (!feeSch || feeSch.equals(feeObjArr[ff].getF4FeeItemModel().getFeeSchudle())))
			{
			amtFee+=feeObjArr[ff].getFee();
			var pfResult = aa.finance.getPaymentFeeItems(capId, null);
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

function feeExists(feestr) // optional statuses to check for
	{
	var checkStatus = false;
	var statusArray = new Array();

	//get optional arguments
	if (arguments.length > 1)
		{
		checkStatus = true;
		for (var i=1; i<arguments.length; i++)
			statusArray.push(arguments[i]);
		}

	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if ( feestr.equals(feeObjArr[ff].getFeeCod()) && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) ) )
			return true;

	return false;
	}

function feeGetTotByDateRange(pStartDate, pEndDate)
	// gets total for fees assessed during date range
	// optional fee statuses to check for
	{
	//get End and Start Dates
	var jsStartDate = new Date(pStartDate);
	jsStartDate.setHours(0,0,0,0); //Bring StartDate to 00:00 AM
	var jsEndDate = new Date(pEndDate);
	jsEndDate.setHours(23,59,59,999); //Bring EndDate close to midnight

	//logDebug("Start Date: "+ (jsStartDate.getMonth()+1).toString() +"/"+jsStartDate.getDate()+"/"+jsStartDate.getFullYear() + " End Date: " + (jsEndDate.getMonth()+1).toString() +"/"+jsEndDate.getDate()+"/"+jsEndDate.getFullYear());

	//get optional arguments
	var checkStatus = false;
	var statusArray = new Array();
	if (arguments.length > 2)
		{
		checkStatus = true;
		for (var i=2; i<arguments.length; i++)
			statusArray.push(arguments[i]);
		}

	//get all feeitems on CAP
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	//get total applicable fees
	var feesTotal = 0;
	var jsFeeDate = new Date();
	for (ff in feeObjArr)
		{
		jsFeeDate.setTime(feeObjArr[ff].getApplyDate().getEpochMilliseconds());
		//logDebug("Fee Apply Date: "+(jsFeeDate.getMonth()+1).toString() +"/"+ jsFeeDate.getDate()+"/"+jsFeeDate.getFullYear());
		if (jsFeeDate  >= jsStartDate && jsFeeDate <= jsEndDate && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray) ) )
			{
			feesTotal += feeObjArr[ff].getFee();
			//logDebug("Added to Total: "+feeObjArr[ff].getFee());
			}
		}

	return feesTotal;
	}

function feeQty(feestr)
	{
	var feeQty = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if (feestr.equals(feeObjArr[ff].getFeeCod()))
			feeQty+=feeObjArr[ff].getFeeUnit();

	return feeQty;
	}

function getAppIdByASI(ASIName,ASIValue,ats)
	//
	// returns the cap Id string of an application based on App-Specific Info and applicationtype.  Returns first result only!
	//
	{
	var ata = ats.split("/");
	if (ata.length != 4)
		logDebug("**ERROR: getAppIdByASI in appMatch.  The following Application Type String is incorrectly formatted: " + ats);

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

		if (isMatch)
			{
			logDebug("getAppIdByName(" + ASIName + "," + ASIValue + "," + ats + ") Returns " + apsArray[aps].getCapID().toString());
			return apsArray[aps].getCapID().toString()
			}
		}
	}

function getAppIdByName(gaGroup,gaType,gaName)
//
// returns the cap Id string of an application that has group,type,and name
//
	{
	getCapResult = aa.cap.getByAppType(gaGroup,gaType);
	if (getCapResult.getSuccess())
		var apsArray = getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting caps by app type: " + getCapResult.getErrorMessage()) ; return null }


	for (aps in apsArray)
		{
		var myCap = aa.cap.getCap(apsArray[aps].getCapID()).getOutput();
		if (myCap.getSpecialText().equals(gaName))
			{
			logDebug("getAppIdByName(" + gaGroup + "," + gaType + "," + gaName + ") Returns " + apsArray[aps].getCapID().toString());
			return apsArray[aps].getCapID().toString()
			}
		}
	}
function getApplication(appNum)
//
// returns the capId object of an application
//
	{
	var getCapResult = aa.cap.getCapID(appNum);
	if (getCapResult.getSuccess())
		return getCapResult.getOutput();
	else
		{ logDebug( "**ERROR: getting cap id (" + appNum + "): " + getCapResult.getErrorMessage()) }
	}

function getAppSpecific(itemName)  // optional: itemCap
	{
	var updated = false;
	var i=0;
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var appspecObj = appSpecInfoResult.getOutput();

		if (itemName != "")
			{
			for (i in appspecObj)
				if (appspecObj[i].getCheckboxDesc() == itemName)
					{
					return appspecObj[i].getChecklistComment();
					break;
					}
			} // item name blank
		}
	else
		{ logDebug( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage()) }
	}

function getCapByAddress(ats)
//
// returns the capid that matches the current address and app type string
// if multiple records will return the first and warning.
//
	{
	var retArr = new Array();

	// get address data
	var addResult = aa.address.getAddressByCapId(capId);
	if (addResult.getSuccess())
		{ var aoArray = addResult.getOutput(); }
	else
		{ logDebug("**ERROR: getting address by cap ID: " + addResult.getErrorMessage()); return false; }

	if (aoArray.length)
		{ var ao = aoArray[0]; }
	else
		{ logDebug("**WARNING: no address for comparison:"); return false; }

	// get caps with same address
	var capAddResult = aa.cap.getCapListByDetailAddress(ao.getStreetName(),ao.getHouseNumberStart(),ao.getStreetSuffix(),ao.getZip(),ao.getStreetDirection(),null);
	if (capAddResult.getSuccess())
	 	{ var capIdArray=capAddResult.getOutput(); }
	else
	 	{ logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());  return false; }


	// loop through related caps
	for (cappy in capIdArray)
		{
		// get file date
		var relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();

		// get cap type

		reltype = relcap.getCapType().toString();

		var isMatch = true;
		var ata = ats.split("/");
		if (ata.length != 4)
			logDebug("**ERROR: The following Application Type String is incorrectly formatted: " + ats);
		else
			for (xx in ata)
				if (!ata[xx].equals(appTypeArray[xx]) && !ata[xx].equals("*"))
					isMatch = false;

		if (isMatch)
			retArr.push(capIdArray[cappy]);

		} // loop through related caps

	if (retArr.length > 1)
		{
		logDebug("**WARNING: Multiple caps returned for this address/apptype") ; return retArr[0]
		}

	if (retArr.length == 0)
		return retArr[0];

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
		{ logDebug("**WARNING: getChildren returned an error"); return false; }

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

function getContactArray()
	{
	// Returns an array of associative arrays with contact attributes.  Attributes are UPPER CASE
	// optional capid
	var thisCap = capId;
	if (arguments.length == 1) thisCap = arguments[0];

	var cArray = new Array();

	var capContactResult = aa.people.getCapContactByCapID(thisCap);
	if (capContactResult.getSuccess())
		{
		var capContactArray = capContactResult.getOutput();
		for (yy in capContactArray)
			{
			var aArray = new Array();
			aArray["lastName"] = capContactArray[yy].getPeople().lastName;
			aArray["firstName"] = capContactArray[yy].getPeople().firstName;
			aArray["businessName"] = capContactArray[yy].getPeople().businessName;
			aArray["contactSeqNumber"] =capContactArray[yy].getPeople().contactSeqNumber;
			aArray["contactType"] =capContactArray[yy].getPeople().contactType;
			aArray["relation"] = capContactArray[yy].getPeople().relation;
			aArray["phone1"] = capContactArray[yy].getPeople().phone1;
			aArray["phone2"] = capContactArray[yy].getPeople().phone2;
			aArray["phone2countrycode"] = capContactArray[yy].getCapContactModel().getPeople().getPhone2CountryCode();


			var pa = capContactArray[yy].getCapContactModel().getPeople().getAttributes().toArray();
	                for (xx1 in pa)
                   		aArray[pa[xx1].attributeName] = pa[xx1].attributeValue;
			cArray.push(aArray);
			}
		}
	return cArray;
	}

function getCSLBInfo(doPop,doWarning)   // doPop = true populate the cap lic prof with this data
					// doWarning = true, message if license is expired.
	{
	// Requires getNode and getProp functions.
	//
	// Get the first lic prof from the app
	//
	var capLicenseResult = aa.licenseScript.getLicenseProf(capId);
	if (capLicenseResult.getSuccess())
		{ var capLicenseArr = capLicenseResult.getOutput();  }
	else
		{ logDebug("**ERROR: getting lic prof: " + capLicenseResult.getErrorMessage()); return false; }

	if (capLicenseArr == null || !capLicenseArr.length)
		{ logDebug("**WARNING: no licensed professionals on this CAP"); return false; }

	var licProfScriptModel = capLicenseArr[0];
	var rlpId = licProfScriptModel.getLicenseNbr();

	//
	// Now make the call to the California State License Board
	//

	var getout = aa.util.httpPost("http://www2.cslb.ca.gov/IVR/License+Detail.asp?LicNum=" + rlpId,"");
	if (getout.getSuccess())
	  var lpXML = getout.getOutput();
	else
	   { logDebug("**ERROR: communicating with CSLB: " + getout.getErrorMessage()); return false; }

	// Check to see if error message in the XML:

	if (lpXML.indexOf("<Error>") > 0 )
		{
		logDebug("**ERROR: CSLB information returned an error: " + getNode(getNode(lpXML,"License"),"**ERROR"))
		return false;
		}

	var lpBiz = getNode(lpXML,"BusinessInfo");
	var lpStatus = getNode(lpXML,"PrimaryStatus");
	var lpClass = getNode(lpXML,"Classifications");
	var lpBonds = getNode(lpXML,"ContractorBond");
	var lpWC = getNode(lpXML,"WorkersComp");

	if (doWarning)
		{
		var expDate = new Date(getNode(lpBiz,"ExpireDt"));
		if (expDate < startDate)
			{
			showMessage = true ;
			comment("**WARNING: Professional License expired on " + expDate.toString());
			}
		}

	if (doPop)
		{
		licProfScriptModel.setAddress1(getNode(lpBiz,"Addr1").replace(/\+/g," "));
		licProfScriptModel.setAddress2(getNode(lpBiz,"Addr2").replace(/\+/g," "));
		licProfScriptModel.setBusinessName(getNode(lpBiz,"Name").replace(/\+/g," "));
		licProfScriptModel.setCity(getNode(lpBiz,"City").replace(/\+/g," "));
		licProfScriptModel.setLicenseExpirDate(aa.date.parseDate(getNode(lpBiz,"ExpireDt")))
		licProfScriptModel.setLicesnseOrigIssueDate(aa.date.parseDate(getNode(lpBiz,"IssueDt")))
		licProfScriptModel.setState(getNode(lpBiz,"State").replace(/\+/g," "))
		licProfScriptModel.setPhone1(getNode(lpBiz,"BusinessPhoneNum"))
		licProfScriptModel.setState(getNode(lpBiz,"State").replace(/\+/g," "))
		licProfScriptModel.setZip(getNode(lpBiz,"Zip"))
		aa.m_licenseProfessional.editLicensedProfessional(licProfScriptModel);
		}
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


function getGISBufferInfo(svc,layer,numDistance)
	{
	// returns an array of associative arrays
	// each additional parameter will return another value in the array
	//x = getGISBufferInfo("flagstaff","Parcels","50","PARCEL_ID1","MAP","BOOK","PARCEL","LOT_AREA");
	//
	//for (x1 in x)
	//   {
	//   aa.print("Object " + x1)
	//   for (x2 in x[x1])
	//      aa.print("  " + x2 + " = " + x[x1][x2])
	//   }

	var distanceType = "feet";
	var retArray = new Array();

	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		for (argnum = 3; argnum < arguments.length ; argnum++)
			buf.addAttributeName(arguments[argnum]);
		}
	else
		{ logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var n = proxObj[z1].getAttributeNames();
				var v = proxObj[z1].getAttributeValues();

				var valArray = new Array();
				for (n1 in n)
					valArray[n[n1]] = v[n1];
				retArray.push(valArray);
				}

			}
		}
	return retArray
	}

function getGISInfo(svc,layer,attributename)
	{
	// use buffer info to get info on the current object by using distance 0
	// usage:
	//
	// x = getGISInfo("flagstaff","Parcels","LOT_AREA");
	//

	var distanceType = "feet";
	var retString;

	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributename);
		}
	else
		{ logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap.  We'll only send the last value
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], "0", distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var v = proxObj[z1].getAttributeValues()
				retString = v[0];
				}

			}
		}
	return retString
	}

// function getInspector: returns the inspector ID (string) of the scheduled inspection.  Returns the first result
//
function getInspector(insp2Check)
	{
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()))
				{
				// have to re-grab the user since the id won't show up in this object.
				inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(),inspList[xx].getInspector().getMiddleName(),inspList[xx].getInspector().getLastName()).getOutput();
				return inspUserObj.getUserID();
				}
		}
	return false;
	}

function getLastInspector(insp2Check)
	// function getLastInspector: returns the inspector ID (string) of the last inspector to result the inspection.
	//
	{
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		inspList = inspResultObj.getOutput();

		inspList.sort(compareInspDateDesc)
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && !inspList[xx].getInspectionStatus().equals("Scheduled"))
				{
				// have to re-grab the user since the id won't show up in this object.
				inspUserObj = aa.person.getUser(inspList[xx].getInspector().getFirstName(),inspList[xx].getInspector().getMiddleName(),inspList[xx].getInspector().getLastName()).getOutput();
				return inspUserObj.getUserID();
				}
		}
	return null;
	}

function compareInspDateDesc(a,b) { return (a.getScheduledDate().getEpochMilliseconds() < b.getScheduledDate().getEpochMilliseconds()); }
function getNode(fString,fName)
	{
	 var fValue = "";
	 var startTag = "<"+fName;
	 var endTag = "</"+fName+">";

	 startPos = fString.indexOf(">", fString.indexOf(startTag)) + 1;
	 endPos = fString.indexOf(endTag);
	 // make sure startPos and endPos are valid before using them
	 if (startPos > 0 && startPos < endPos)
		  fValue = fString.substring(startPos,endPos);

	 return unescape(fValue);
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

function getProp(fString,fName)
	{
	 var fValue = "";
	 var startTag = fName + "='";
	 var endTag = "'";
	 startPos = fString.indexOf(startTag) + startTag.length;
	 if (startPos > 0)
	   fValue = fString.substring(startPos);

	 endPos = fValue.indexOf(endTag);
	 if (endPos > 0)
	  fValue = fValue.substring(0,endPos);

	return unescape(fValue);
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
			if (newLicArray[thisLic] && refstlic && refstlic.toUpperCase().equals(newLicArray[thisLic].getStateLicense().toUpperCase()))
				refLicObj = newLicArray[thisLic];
		}

	return refLicObj;
	}

function getRelatedCapsByAddress(ats)
//
// returns and array of capids that share the same address as the current cap
//
	{
	var retArr = new Array();

	// get address data
	var addResult = aa.address.getAddressByCapId(capId);
	if (addResult.getSuccess())
		{ var aoArray = addResult.getOutput(); }
	else
		{ logDebug("**ERROR: getting address by cap ID: " + addResult.getErrorMessage()); return false; }

	for (zzz in aoArray)
		{
		var ao = aoArray[zzz];
		// get caps with same address
		capAddResult = aa.cap.getCapListByDetailAddress(ao.getStreetName(),ao.getHouseNumberStart(),ao.getStreetSuffix(),null,ao.getStreetDirection(),null);
		if (capAddResult.getSuccess())
			{ var capIdArray=capAddResult.getOutput(); }
		else
			{ logDebug("**ERROR: getting similar addresses: " + capAddResult.getErrorMessage());  return false; }


		// loop through related caps
		for (cappy in capIdArray)
			{
			// skip if current cap
			if (capId.getCustomID().equals(capIdArray[cappy].getCustomID()))
				continue;

			// get cap id
			var relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();


			// get cap type

			var reltypeArray = relcap.getCapType().toString().split("/");

			var isMatch = true;
			var ata = ats.split("/");
			if (ata.length != 4)
				logDebug("**ERROR: The following Application Type String is incorrectly formatted: " + ats);
			else
				for (xx in ata)
					if (!ata[xx].equals(reltypeArray[xx]) && !ata[xx].equals("*"))
						isMatch = false;

			if (isMatch)
				retArr.push(capIdArray[cappy]);

			} // loop through related caps

		}
	if (retArr.length > 0)
		return retArr;

	}


function getRelatedCapsByParcel(ats)
//
// returns and array of capids that match parcels on the current app.  Includes all parcels.
// ats, app type string to check for
//
	{
	var retArr = new Array();

	var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
	if (capParcelResult.getSuccess())
		{ var Parcels = capParcelResult.getOutput().toArray(); }
	else
		{ logDebug("**ERROR: getting parcels by cap ID: " + capParcelResult.getErrorMessage()); return false; }

	for (zz in Parcels)
		{
		var ParcelValidatedNumber = Parcels[zz].getParcelNumber();

		// get caps with same parcel
		var capAddResult = aa.cap.getCapListByParcelID(ParcelValidatedNumber,null);
		if (capAddResult.getSuccess())
			{ var capIdArray=capAddResult.getOutput(); }
		else
			{ logDebug("**ERROR: getting similar parcels: " + capAddResult.getErrorMessage());  return false; }

		// loop through related caps
		for (cappy in capIdArray)
			{
			// skip if current cap
			if (capId.getCustomID().equals(capIdArray[cappy].getCustomID()))
				continue;

			// get cap ids
			var relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();
			// get cap type
			var reltypeArray = relcap.getCapType().toString().split("/");

			var isMatch = true;
			var ata = ats.split("/");
			if (ata.length != 4)
				logDebug("**ERROR: The following Application Type String is incorrectly formatted: " + ats);
			else
				for (xx in ata)
					if (!ata[xx].equals(reltypeArray[xx]) && !ata[xx].equals("*"))
						isMatch = false;

			if (isMatch)
				retArr.push(capIdArray[cappy]);

			} // loop through related caps
		}

	if (retArr.length > 0)
		return retArr;

	}

function getScheduledInspId(insp2Check)
	{
	// warning, returns only the first scheduled occurrence
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(insp2Check).equals(inspList[xx].getInspectionType()) && inspList[xx].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
				return inspList[xx].getIdNumber();
		}
	return false;
	}

function getTaskDueDate(wfstr) // optional process name.
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
  		if ((fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase()) || wfstr == "*")  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var dueDate = wfObj[i].getDueDate();
			if (dueDate)
				return new Date(dueDate.getMonth() + "/" + dueDate.getDayOfMonth() + "/" + dueDate.getYear());
			}
		}
	}

function getTaskStatusForEmail(stask)
	{
	// returns a string of task statuses for a workflow group
	var returnStr = ""
	var taskResult = aa.workflow.getTasks(capId);
	if (taskResult.getSuccess())
		{ var taskArr = taskResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting tasks : " + taskResult.getErrorMessage()); return false }

	for (xx in taskArr)
		if (taskArr[xx].getProcessCode().equals(stask) && taskArr[xx].getCompleteFlag().equals("Y"))
			{
			returnStr+="Task Name: " + taskArr[xx].getTaskDescription() + "\n";
			returnStr+="Task Status: " + taskArr[xx].getDisposition() + "\n";
			if (taskArr[xx].getDispositionComment() != null)
				returnStr+="Task Comments: " + taskArr[xx].getDispositionComment() + "\n" ;
			returnStr+="\n";
			}
	logDebug(returnStr);
	return returnStr;
	}

function inspCancelAll()
	{
	var isCancelled = false;
	var inspResults = aa.inspection.getInspections(capId);
	if (inspResults.getSuccess())
		{
		var inspAll = inspResults.getOutput();
		var inspectionId;
		var cancelResult;
		for (ii in inspAll)
			{
			if (inspAll[ii].getDocumentDescription().equals("Insp Scheduled") && inspAll[ii].getAuditStatus().equals("A"))
				{
				inspectionId = inspAll[ii].getIdNumber();		// Inspection identifier
				cancelResult = aa.inspection.cancelInspection(capId,inspectionId);
				if (cancelResult.getSuccess())
					{
					logMessage("Cancelling inspection: " + inspAll[ii].getInspectionType());
					isCancelled = true;
					}
				else
					logMessage("**ERROR","**ERROR: Cannot cancel inspection: "+inspAll[ii].getInspectionType()+", "+cancelResult.getErrorMessage());
				}
		  }
		}
	else
		logMessage("**ERROR: getting inspections: " + inspResults.getErrorMessage());

	return isCancelled;
	}

function isScheduled(inspType)
	{
	var found = false;
	var inspResultObj = aa.inspection.getInspections(capId);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(inspType).equals(inspList[xx].getInspectionType()))
				found = true;
		}
	return found;
	}

function isTaskActive(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			if (fTask.getActiveFlag().equals("Y"))
				return true;
			else
				return false;
		}
	}

function isTaskComplete(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			if (fTask.getCompleteFlag().equals("Y"))
				return true;
			else
				return false;
		}
	}

function isTaskStatus(wfstr,wfstat) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length > 2)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{
		logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage());
		return false;
		}

	for (i in wfObj)
		{
   		fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			if (fTask.getDisposition()!=null)
				{
				if (fTask.getDisposition().toUpperCase().equals(wfstat.toUpperCase()))
					return true;
				else
					return false;
				}
		}
	return false;
	}

function jsDateToMMDDYYYY(pJavaScriptDate)
	{
	//converts javascript date to string in MM/DD/YYYY format
	//
	if (pJavaScriptDate != null)
		{
		if (Date.prototype.isPrototypeOf(pJavaScriptDate))
	return (pJavaScriptDate.getMonth()+1).toString()+"/"+pJavaScriptDate.getDate()+"/"+pJavaScriptDate.getFullYear();
		else
			{
			logDebug("Parameter is not a javascript date");
			return ("INVALID JAVASCRIPT DATE");
			}
		}
	else
		{
		logDebug("Parameter is null");
		return ("NULL PARAMETER VALUE");
		}
	}

function licEditExpInfo (pExpStatus, pExpDate)
	{
	//Edits expiration status and/or date
	//Needs licenseObject function
	//06SSP-00238
	//
	var lic = new licenseObject(null);
	if (pExpStatus!=null)
		{
		lic.setStatus(pExpStatus);
		}

	if (pExpDate!=null)
		{
		lic.setExpiration(pExpDate);
		}
	}

function licenseObject(licnumber)  // optional renewal Cap ID -- uses the expiration on the renewal CAP.
	{
	itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args


	this.refProf = null;		// licenseScriptModel (reference licensed professional)
	this.b1Exp = null;		// b1Expiration record (renewal status on application)
	this.b1ExpDate = null;
	this.b1ExpCode = null;
	this.b1Status = null;
	this.refExpDate = null;
	this.licNum = licnumber;	// License Number


	// Load the reference License Professional if we're linking the two
	if (licnumber) // we're linking
		{
		var newLic = getRefLicenseProf(licnumber)
		if (newLic)
				{
				this.refProf = newLic;
				tmpDate = newLic.getLicenseExpirationDate();
				if (tmpDate)
						this.refExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear();
				logDebug("Loaded reference license professional with Expiration of " + this.refExpDate);
				}
		}

   	// Load the renewal info (B1 Expiration)

   	b1ExpResult = aa.expiration.getLicensesByCapID(itemCap)
   		if (b1ExpResult.getSuccess())
   			{
   			this.b1Exp = b1ExpResult.getOutput();
			tmpDate = this.b1Exp.getExpDate();
			if (tmpDate)
				this.b1ExpDate = tmpDate.getMonth() + "/" + tmpDate.getDayOfMonth() + "/" + tmpDate.getYear();
			this.b1Status = this.b1Exp.getExpStatus();
			logDebug("Found renewal record of status : " + this.b1Status + ", Expires on " + this.b1ExpDate);
			}
		else
			{ logDebug("**ERROR: Getting B1Expiration Object for Cap.  Reason is: " + b1ExpResult.getErrorType() + ":" + b1ExpResult.getErrorMessage()) ; return false }


   	this.setExpiration = function(expDate)
   		// Update expiration date
   		{
   		var expAADate = aa.date.parseDate(expDate);

   		if (this.refProf) {
   			this.refProf.setLicenseExpirationDate(expAADate);
   			aa.licenseScript.editRefLicenseProf(this.refProf);
   			logDebug("Updated reference license expiration to " + expDate); }

   		if (this.b1Exp)  {
 				this.b1Exp.setExpDate(expAADate);
				aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
				logDebug("Updated renewal to " + expDate); }
   		}

	this.setIssued = function(expDate)
		// Update Issued date
		{
		var expAADate = aa.date.parseDate(expDate);

		if (this.refProf) {
			this.refProf.setLicenseIssueDate(expAADate);
			aa.licenseScript.editRefLicenseProf(this.refProf);
			logDebug("Updated reference license issued to " + expDate); }

		}
	this.setLastRenewal = function(expDate)
		// Update expiration date
		{
		var expAADate = aa.date.parseDate(expDate)

		if (this.refProf) {
			this.refProf.setLicenseLastRenewalDate(expAADate);
			aa.licenseScript.editRefLicenseProf(this.refProf);
			logDebug("Updated reference license issued to " + expDate); }
		}

	this.setStatus = function(licStat)
		// Update expiration status
		{
		if (this.b1Exp)  {
			this.b1Exp.setExpStatus(licStat);
			aa.expiration.editB1Expiration(this.b1Exp.getB1Expiration());
			logDebug("Updated renewal to status " + licStat); }
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

function loadAppSpecific(thisArr) {
	//
	// Returns an associative array of App Specific Info
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

    	var appSpecInfoResult = aa.appSpecificInfo.getByCapID(itemCap);
	if (appSpecInfoResult.getSuccess())
	 	{
		var fAppSpecInfoObj = appSpecInfoResult.getOutput();

		for (loopk in fAppSpecInfoObj)
			{
			if (useAppSpecificGroupName)
				thisArr[fAppSpecInfoObj[loopk].getCheckboxType() + "." + fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
			else
				thisArr[fAppSpecInfoObj[loopk].checkboxDesc] = fAppSpecInfoObj[loopk].checklistComment;
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



function loadASITable(tname) {

 	//
 	// Returns a single ASI Table array of arrays
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();
	  var tn = tsm.getTableName();

      if (!tn.equals(tname)) continue;

	  if (tsm.rowIndex.isEmpty())
	  	{
			logDebug("Couldn't load ASI Table " + tname + " it is empty");
			return false;
		}

   	  var tempObject = new Array();
	  var tempArray = new Array();

  	  var tsmfldi = tsm.getTableField().iterator();
	  var tsmcoli = tsm.getColumns().iterator();
          var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator(); // get Readonly filed
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
		//tempObject[tcol.getColumnName()] = tval;
                /********************Build Array<FieldInfo> start********************/
		//get this field readonly value
		var readOnly = 'N';
		if (readOnlyi.hasNext()) {
			readOnly = readOnlyi.next();
		}
		//set data to FieldInfo Object
		var fieldInfo = new FieldInfo(tcol.getColumnName(), tval, readOnly);
		tempObject[tcol.getColumnName()] = fieldInfo;
		/********************Build Array<FieldInfo> end********************/

		}
	  tempArray.push(tempObject);  // end of record
	  }
	  return tempArray;
	}

function loadASITables() {

 	//
 	// Loads App Specific tables into their own array of arrays.  Creates global array objects
	//
	// Optional parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 1) itemCap = arguments[0]; // use cap ID specified in args

	var gm = aa.appSpecificTableScript.getAppSpecificTableGroupModel(itemCap).getOutput();
	var ta = gm.getTablesArray()
	var tai = ta.iterator();

	while (tai.hasNext())
	  {
	  var tsm = tai.next();

	  if (tsm.rowIndex.isEmpty()) continue;  // empty table

	  var tempObject = new Array();
	  var tempArray = new Array();
	  var tn = tsm.getTableName();

	  tn = String(tn).replace(/[^a-zA-Z0-9]+/g,'');

	  if (!isNaN(tn.substring(0,1))) tn = "TBL" + tn  // prepend with TBL if it starts with a number

  	  var tsmfldi = tsm.getTableField().iterator();
	  var tsmcoli = tsm.getColumns().iterator();

	  var readOnlyi = tsm.getAppSpecificTableModel().getReadonlyField().iterator();

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
		//tempObject[tcol.getColumnName()] = tval;
                /********************Build Array<FieldInfo> start********************/
		//get this field readonly value
		var readOnly = 'N';
		if (readOnlyi.hasNext()) {
			readOnly = readOnlyi.next();
		}
		//set data to FieldInfo Object
		var fieldInfo = new FieldInfo(tcol.getColumnName(), tval, readOnly);
		tempObject[tcol.getColumnName()] = fieldInfo;
		/********************Build Array<FieldInfo> end********************/

		}
	  tempArray.push(tempObject);  // end of record
	  var copyStr = "" + tn + " = tempArray";
	  //aa.print("ASI Table Array : " + tn + " (" + numrows + " Rows)");
          eval(copyStr);  // move to table name

	  }

	}

function loadParcelAttributes(thisArr) {
	//
	// Returns an associative array of Parcel Attributes
	// Optional second parameter, cap ID to load from
	//

	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	var fcapParcelObj = null;
   	var capParcelResult = aa.parcel.getParcelandAttribute(itemCap, null);
   	if (capParcelResult.getSuccess())
   		var fcapParcelObj = capParcelResult.getOutput().toArray();
   	else
     		logDebug("**ERROR: Failed to get Parcel object: " + capParcelResult.getErrorType() + ":" + capParcelResult.getErrorMessage())

  	for (i in fcapParcelObj)
  		{
  		parcelArea += fcapParcelObj[i].getParcelArea()
  		parcelAttrObj = fcapParcelObj[i].getParcelAttribute().toArray();
  		for (z in parcelAttrObj)
			thisArr["ParcelAttribute." + parcelAttrObj[z].getB1AttributeName()]=parcelAttrObj[z].getB1AttributeValue();

		// Explicitly load some standard values
		thisArr["ParcelAttribute.Block"] = fcapParcelObj[i].getBlock();
		thisArr["ParcelAttribute.Book"] = fcapParcelObj[i].getBook();
		thisArr["ParcelAttribute.CensusTract"] = fcapParcelObj[i].getCensusTract();
		thisArr["ParcelAttribute.CouncilDistrict"] = fcapParcelObj[i].getCouncilDistrict();
		thisArr["ParcelAttribute.ExemptValue"] = fcapParcelObj[i].getExemptValue();
		thisArr["ParcelAttribute.ImprovedValue"] = fcapParcelObj[i].getImprovedValue();
		thisArr["ParcelAttribute.InspectionDistrict"] = fcapParcelObj[i].getInspectionDistrict();
		thisArr["ParcelAttribute.LandValue"] = fcapParcelObj[i].getLandValue();
		thisArr["ParcelAttribute.LegalDesc"] = fcapParcelObj[i].getLegalDesc();
		thisArr["ParcelAttribute.Lot"] = fcapParcelObj[i].getLot();
		thisArr["ParcelAttribute.MapNo"] = fcapParcelObj[i].getMapNo();
		thisArr["ParcelAttribute.MapRef"] = fcapParcelObj[i].getMapRef();
		thisArr["ParcelAttribute.ParcelStatus"] = fcapParcelObj[i].getParcelStatus();
		thisArr["ParcelAttribute.SupervisorDistrict"] = fcapParcelObj[i].getSupervisorDistrict();
		thisArr["ParcelAttribute.Tract"] = fcapParcelObj[i].getTract();
		thisArr["ParcelAttribute.PlanArea"] = fcapParcelObj[i].getPlanArea();
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
		taskArr[fTask.getTaskDescription()] = myTask;
		}
	return taskArr;
	}

function Task() // Task Object
	{
	this.status = null
	this.comment = null;
	this.note = null;
        this.statusdate = null;
	this.process = null;
	this.processID = null;
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
 		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()) ; return false; }

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
function lookup(stdChoice,stdValue)
	{
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);

   	if (bizDomScriptResult.getSuccess())
   		{
		var bizDomScriptObj = bizDomScriptResult.getOutput();
		var strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
	}

function lookupDateRange(stdChoiceEntry,dateValue) // optional val number
	{
	var valNumber = 1;
	if (arguments.length == 3) valNumber = arguments[2];

	var compDate = new Date(dateValue);
	var domArr
	for (var count=1; count <= 9999; count++)  // Must be sequential from 01 up to 9999
		{
		var countstr = "0000" + count;
		var countstr = String(countstr).substring(countstr.length,countstr.length - 4);
		var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoiceEntry,countstr);

	   	if (bizDomScriptResult.getSuccess())
	   		{
			var bizDomScriptObj = bizDomScriptResult.getOutput();
			var domVal = bizDomScriptObj.getDescription();
			if (bizDomScriptObj.getAuditStatus() != 'I')
				{
				var domOld = domArr;
				var domArr = domVal.split("\\^")
				var domDate = new Date(domArr[0])
				if (domDate >= compDate)     //  found the next tier, use the last value
					if (domOld)
						return domOld[valNumber];
					else
						break;
				}
			}
		else
			if (domArr)
				return domArr[valNumber];
			else
				break;
		}
	}
function lookupFeesByValuation(stdChoiceEntry,stdChoiceValue,capval) // optional arg number
	{
	var valNumber = 1;
	if (arguments.length == 4) valNumber = arguments[3];

	var saveVal ;
	var lookupStr = lookup(stdChoiceEntry,stdChoiceValue);

	if (lookupStr)
		{
		workArr = lookupStr.split("^");
		for (var i in workArr)
			{
                        //aa.print(workArr[i]);
			workVals = workArr[i].split("|");
			if (workVals[0] > capval)
				return saveVal;
			else
				if (valNumber == 1)
					saveVal = workVals[valNumber];
				else
					{
					saveVal = parseInt((capval - workVals[0])/100);
					if ((capval - workVals[0]) % 100 > 0) saveVal++;
					saveVal = saveVal * workVals[valNumber];
					}
			}
		}
	return saveVal;
	}


function loopTask(wfstr,wfstat,wfcomment,wfnote) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 5)
		{
		processName = arguments[4]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	if (!wfstat) wfstat = "NA";

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();

			if (useProcess)
				aa.workflow.handleDisposition(capId,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");
			else
				aa.workflow.handleDisposition(capId,stepnumber,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj ,"L");

			logMessage("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Looping...");
			logDebug("Closing Workflow Task: " + wfstr + " with status " + wfstat + ", Looping...");
			}
		}
	}

function nextWorkDay(td)
	// uses app server to return the next work day.
	// Only available in 6.3.2
	// td can be "mm/dd/yyyy" (or anything that will convert to JS date)
	{

	if (!td)
		dDate = new Date();
	else
		dDate = new Date(td);

	if (!aa.calendar.getNextWorkDay)
		{
		logDebug("getNextWorkDay function is only available in Accela Automation 6.3.2 or higher.");
		}
	else
		{
		var dDate = new Date(aa.calendar.getNextWorkDay(aa.date.parseDate(dDate.getMonth()+1 + "/" + dDate.getDate() + "/" + dDate.getFullYear())).getOutput().getTime());
		}

	return (dDate.getMonth()+1) + "/" + dDate.getDate() + "/" + dDate.getFullYear();;
	}


function openUrlInNewWindow(myurl)
 {
 //
 // showDebug or showMessage must be true for this to work
 //
 newurl = "<SCRIPT LANGUAGE=\"JavaScript\">\r\n<!--\r\n newwin = window.open(\""
 newurl+=myurl
 newurl+="\"); \r\n  //--> \r\n </SCRIPT>"

 comment(newurl)
 }

function parcelConditionExists(condtype)
	{
	var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
	if (!capParcelResult.getSuccess())
		{ logDebug("**WARNING: error getting cap parcels : " + capParcelResult.getErrorMessage()) ; return false }

	var Parcels = capParcelResult.getOutput().toArray();
	for (zz in Parcels)
		{
		pcResult = aa.parcelCondition.getParcelConditions(Parcels[zz].getParcelNumber());
		if (!pcResult.getSuccess())
			{ logDebug("**WARNING: error getting parcel conditions : " + pcResult.getErrorMessage()) ; return false }
		pcs = pcResult.getOutput();
		for (pc1 in pcs)
			if (pcs[pc1].getConditionType().equals(condtype)) return true;
		}
	}

function paymentGetNotAppliedTot() //gets total Amount Not Applied on current CAP
	{
	var amtResult = aa.cashier.getSumNotAllocated(capId);
	if (amtResult.getSuccess())
		{
		var appliedTot = amtResult.getOutput();
		//logDebug("Total Amount Not Applied = $"+appliedTot.toString());
		return parseFloat(appliedTot);
		}
	else
		{
		logDebug("**ERROR: Getting total not applied: " + amtResult.getErrorMessage());
		return false;
		}
	return false;
	}

function proximity(svc,layer,numDistance)  // optional: distanceType
	{
	// returns true if the app has a gis object in proximity
	// use with all events except ApplicationSubmitBefore
	// 6/20/07 JHS - Changed errors to Warnings in case GIS server unavailable.

	var distanceType = "feet"
	if (arguments.length == 4) distanceType = arguments[3]; // use distance type in arg list

	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		buf.addAttributeName(layer + "_ID");
		}
	else
		{ logDebug("**WARNING: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**WARNING: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**WARNING: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			if (proxObj.length)
				{
				return true;
				}
			}
		}
	}

function proximityToAttribute(svc,layer,numDistance,distanceType,attributeName,attributeValue)
	{
	// returns true if the app has a gis object in proximity that contains the attributeName = attributeValue
	// use with all events except ApplicationSubmitBefore
	// example usage:
	// 01 proximityToAttribute("flagstaff","Parcels","50","feet","BOOK","107") ^ DoStuff...

	var bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		var buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributeName);
		}
	else
		{ logDebug("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }

	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }

		for (a2 in proxArr)
			{
			proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var v = proxObj[z1].getAttributeValues()
				retString = v[0];

				if (retString && retString.equals(attributeValue))
					return true;
				}

			}
		}
	}

function refLicProfGetAttribute(pLicNum, pAttributeName)
	{
	//Gets value of custom attribute from reference license prof record
	//07SSP-00033/SP5014

	//validate parameter values
	if (pLicNum==null || pLicNum.length==0 || pAttributeName==null || pAttributeName.length==0)
		{
		logDebug("Invalid license number or attribute name parameter");
		return ("INVALID PARAMETER");
		}

	//get reference License Professional record

	var newLic = getRefLicenseProf(pLicNum)

	//get reference License Professional's license seq num
	var licSeqNum = 0;
	var attributeType = "";
	if (newLic)
		{
		licSeqNum = newLic.getLicSeqNbr();
		attributeType = newLic.getLicenseType();
		logDebug("License Seq Num: "+licSeqNum + ", License Type: "+attributeType);
		}
	else
		{
		logMessage("No reference licensed professional found with state license number of "+pLicNum);
		logDebug("No reference licensed professional found with state license number of "+pLicNum);
		return ("NO LICENSE FOUND");
		}

	//get ref Lic Prof custom attribute using license seq num & attribute type
	if ( !(licSeqNum==0 || licSeqNum==null || attributeType=="" || attributeType==null) )
		{
		var peopAttrResult = aa.people.getPeopleAttributeByPeople(licSeqNum, attributeType);
			if (!peopAttrResult.getSuccess())
			{
			logDebug("**ERROR retrieving reference license professional attribute: " + peopAttrResult.getErrorMessage());
			return false;
			}

		var peopAttrArray = peopAttrResult.getOutput();
		if (peopAttrArray)
			{
			for (i in peopAttrArray)
				{
				if ( pAttributeName.equals(peopAttrArray[i].getAttributeName()) )
					{
					logDebug("Reference record for license "+pLicNum+", attribute "+pAttributeName+": "+peopAttrArray[i].getAttributeValue());
					return peopAttrArray[i].getAttributeValue();
					}
				}
			logDebug("Reference record for license "+pLicNum+" has no attribute named "+pAttributeName);
			return ("ATTRIBUTE NOT FOUND");
			}
		else
			{
			logDebug("Reference record for license "+pLicNum+" has no custom attributes");
			return ("ATTRIBUTE NOT FOUND");
			}
		}
	else
		{
		logDebug("Missing seq nbr or license type");
		return false;
		}
	}
function refLicProfGetDate (pLicNum, pDateType)
	{
	//Returns expiration date from reference licensed professional record.  Skips disabled reference licensed professionals.
	//pDateType parameter decides which date field is returned.  Options: "EXPIRE" (default), "RENEW","ISSUE","BUSINESS","INSURANCE"
	//Internal Functions needed: convertDate(), jsDateToMMDDYYYY()
	//07SSP-00033/SP5014  Edited for SR5054A.R70925
	//
	if (pDateType==null || pDateType=="")
		var dateType = "EXPIRE";
	else
		{
		var dateType = pDateType.toUpperCase();
		if ( !(dateType=="ISSUE" || dateType=="RENEW" || dateType=="BUSINESS" || dateType=="INSURANCE") )
			dateType = "EXPIRE";
		}

	if (pLicNum==null || pLicNum=="")
		{
		logDebug("Invalid license number parameter");
		return ("INVALID PARAMETER");
		}

	var newLic = getRefLicenseProf(pLicNum)

	if (newLic)
		{
		var jsExpDate = new Date();

 		if (dateType=="EXPIRE")
			{
			if (newLic.getLicenseExpirationDate())
				{
				jsExpDate = convertDate(newLic.getLicenseExpirationDate());
				logDebug(pLicNum+" License Expiration Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no License Expiration Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="INSURANCE")
			{
			if (newLic.getInsuranceExpDate())
				{
				jsExpDate = convertDate(newLic.getInsuranceExpDate());
				logDebug(pLicNum+" Insurance Expiration Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Insurance Expiration Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="BUSINESS")
			{
			if (newLic.getBusinessLicExpDate())
				{
				jsExpDate = convertDate(newLic.getBusinessLicExpDate());
				logDebug(pLicNum+" Business Lic Expiration Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Business Lic Exp Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="ISSUE")
			{
			if (newLic.getLicenseIssueDate())
				{
				jsExpDate = convertDate(newLic.getLicenseIssueDate());
				logDebug(pLicNum+" License Issue Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Issue Date");
				return ("NO DATE FOUND");
				}
			}
		else if (dateType=="RENEW")
			{
			if (newLic.getLicenseLastRenewalDate())
				{
				jsExpDate = convertDate(newLic.getLicenseLastRenewalDate());
				logDebug(pLicNum+" License Last Renewal Date: "+jsDateToMMDDYYYY(jsExpDate));
				return jsExpDate;
				}
			else
				{
				logDebug("Reference record for license "+pLicNum+" has no Last Renewal Date");
				return ("NO DATE FOUND");
				}
			}
		else
			return ("NO DATE FOUND");
		}
	}



function addASITable(tableName,tableValueArray) // optional capId
  	{

	//  tableName is the name of the ASI table
	//  tableValueArray is an array of associative array values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 2)
		itemCap = arguments[2]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.getAppSpecificTableModel(itemCap,tableName)

	if (!tssmResult.getSuccess())
		{ logDebug("**WARNING: error retrieving app specific table " + tableName + " " + tssmResult.getErrorMessage()) ; return false }

	var tssm = tssmResult.getOutput();
	var tsm = tssm.getAppSpecificTableModel();
	var fld = tsm.getTableField();
        var fld_readonly = tsm.getReadonlyField(); // get Readonly field

       	for (thisrow in tableValueArray)
		{

		var col = tsm.getColumns()
		var coli = col.iterator();

		while (coli.hasNext())
			{
			var colname = coli.next();

			//fld.add(tableValueArray[thisrow][colname.getColumnName()]);
			fld.add(tableValueArray[thisrow][colname.getColumnName()].fieldValue);
			fld_readonly.add(tableValueArray[thisrow][colname.getColumnName()].readOnly);

			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()].fieldValue);
			}

		tsm.setTableField(fld);

		tsm.setReadonlyField(fld_readonly);
                //if (tsm.setReadonlyField) tsm.setReadonlyField(null);  // check for 6.6.1.   If so need to populate with null

		}

	var addResult = aa.appSpecificTableScript.editAppSpecificTableInfos(tsm, itemCap, currentUserID);

	// Even when this works it gives an index out of range error
	//if (!addResult .getSuccess())
	//	{ logDebug("**WARNING: error adding record to ASI Table:  " + tableName + " " + addResult.getErrorMessage()) ; return false }
	//else
		logDebug("Successfully added record to ASI Table: " + tableName);

	}


	function removeASITable(tableName) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValues is an associative array of values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.removeAppSpecificTableInfos(tableName,itemCap,currentUserID)

	if (!tssmResult.getSuccess())
		{ //aa.print("**WARNING: error removing ASI table " + tableName + " " + tssmResult.getErrorMessage()) ; 
		return false; }
        else
	logDebug("Successfully removed all rows from ASI Table: " + tableName);

	}
	
function removeCapCondition(cType,cDesc)
	{
	var itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

	var capCondResult = aa.capCondition.getCapConditions(itemCap,cType);

	if (!capCondResult.getSuccess())
		{logDebug("**WARNING: error getting cap conditions : " + capCondResult.getErrorMessage()) ; return false }

	var ccs = capCondResult.getOutput();
		for (pc1 in ccs)
			{
			if (ccs[pc1].getConditionDescription().equals(cDesc))
				{
				var rmCapCondResult = aa.capCondition.deleteCapCondition(itemCap,ccs[pc1].getConditionNumber());
				if (rmCapCondResult.getSuccess())
					logDebug("Successfully removed condition to CAP : " + itemCap + "  (" + cType + ") " + cDesc);
				else
					logDebug( "**ERROR: removing condition to Parcel " + parcelNum + "  (" + cType + "): " + addParcelCondResult.getErrorMessage());
				}
			}
	}


function removeFee(fcode,fperiod) // Removes all fee items for a fee code and period
	{
	getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
	if (getFeeResult.getSuccess())
		{
		var feeList = getFeeResult.getOutput();
		for (feeNum in feeList)
			{
			if (feeList[feeNum].getFeeitemStatus().equals("NEW"))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();

				var editResult = aa.finance.removeFeeItem(capId, feeSeq);
				if (editResult.getSuccess())
					{
					logDebug("Removed existing Fee Item: " + fcode);
					}
				else
					{ logDebug( "**ERROR: removing fee item (" + fcode + "): " + editResult.getErrorMessage()); break }
				}
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
				logDebug("Invoiced fee "+fcode+" found, not removed");
				}
			}
		}
	else
		{ logDebug( "**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())}

	}

function removeParcelCondition(parcelNum,cType,cDesc)
//if parcelNum is null, condition is added to all parcels on CAP
	{
	if (!parcelNum)
		{
		var capParcelResult = aa.parcel.getParcelandAttribute(capId,null);
		if (capParcelResult.getSuccess())
			{
			var Parcels = capParcelResult.getOutput().toArray();
			for (zz in Parcels)
				{
				parcelNum = Parcels[zz].getParcelNumber()
				logDebug("Adding Condition to parcel #" + zz + " = " + parcelNum);
				var pcResult = aa.parcelCondition.getParcelConditions(parcelNum);
				if (!pcResult.getSuccess())
					{ logDebug("**WARNING: error getting parcel conditions : " + pcResult.getErrorMessage()) ; return false }
				var pcs = pcResult.getOutput();
				for (pc1 in pcs)
					{
					if (pcs[pc1].getConditionType().equals(cType) && pcs[pc1].getConditionDescription().equals(cDesc))
						{
						var rmParcelCondResult = aa.parcelCondition.removeParcelCondition(pcs[pc1].getConditionNumber(),parcelNum);
						if (rmParcelCondResult.getSuccess())
							logDebug("Successfully removed condition to Parcel " + parcelNum + "  (" + cType + ") " + cDesc);
						}
					else
						logDebug( "**ERROR: removing condition to Parcel " + parcelNum + "  (" + cType + "): " + addParcelCondResult.getErrorMessage());
					}
				}
			}
		}
	else
		{
		var pcResult = aa.parcelCondition.getParcelConditions(parcelNum);
		if (!pcResult.getSuccess())
			{ logDebug("**WARNING: error getting parcel conditions : " + pcResult.getErrorMessage()) ; return false }
		var pcs = pcResult.getOutput();
		for (pc1 in pcs)
			{
			if (pcs[pc1].getConditionType().equals(cType) && pcs[pc1].getConditionDescription().equals(cDesc))
				{
				var rmParcelCondResult = aa.parcelCondition.removeParcelCondition(pcs[pc1].getConditionNumber(),parcelNum);
			        if (rmParcelCondResult.getSuccess())
					logDebug("Successfully removed condition to Parcel " + parcelNum + "  (" + cType + ") " + cDesc);
				}
			else
				logDebug( "**ERROR: removing condition to Parcel " + parcelNum + "  (" + cType + "): " + addParcelCondResult.getErrorMessage());
			}
		}
	}

function resultInspection(inspType,inspStatus,resultDate,resultComment)  //optional capId
	{
	var itemCap = capId
	if (arguments.length > 4) itemCap = arguments[4]; // use cap ID specified in args

	var foundID;
	var inspResultObj = aa.inspection.getInspections(itemCap);
	if (inspResultObj.getSuccess())
		{
		var inspList = inspResultObj.getOutput();
		for (xx in inspList)
			if (String(inspType).equals(inspList[xx].getInspectionType()) && inspList[xx].getInspectionStatus().toUpperCase().equals("SCHEDULED"))
				foundID = inspList[xx].getIdNumber();
		}

	if (foundID)
		{
		resultResult = aa.inspection.resultInspection(itemCap, foundID, inspStatus, resultDate, resultComment, currentUserID)

		if (resultResult.getSuccess())
			logDebug("Successfully resulted inspection: " + inspType + " to Status: " + inspStatus)
		else
			logDebug("**WARNING could not result inspection : " + inspType + ", " + resultResult.getErrorMessage())
		}
	else
			logDebug("Could not result inspection : " + inspType + ", not scheduled")

	}

function scheduleInspectDate(iType,DateToSched) // optional inspector ID.
// DQ - Added Optional 4th parameter inspTime Valid format is HH12:MIAM or AM (SR5110)
// DQ - Added Optional 5th parameter inspComm
	{
	var inspectorObj = null;
	var inspTime = null;
	var inspComm = "";
	if (arguments.length >= 3)
		if (arguments[2] != null)
		{
		var inspRes = aa.person.getUser(arguments[2])
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

function scheduleInspection(iType,DaysAhead) // optional inspector ID.  This function requires dateAdd function
	{
	var inspectorObj = null;
	if (arguments.length == 3)
		{
		var inspRes = aa.person.getUser(arguments[2])
		if (inspRes.getSuccess())
			var inspectorObj = inspRes.getOutput();
		}

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(dateAdd(null,DaysAhead)), null, iType, "Scheduled via Script")

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + dateAdd(null,DaysAhead));
	else
		logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}

function taskCloseAllExcept(pStatus,pComment)
	{
	// Closes all tasks in CAP with specified status and comment
	// Optional task names to exclude
	// 06SSP-00152
	//
	var taskArray = new Array();
	var closeAll = false;
	if (arguments.length > 2) //Check for task names to exclude
		{
		for (var i=2; i<arguments.length; i++)
			taskArray.push(arguments[i]);
		}
	else
		closeAll = true;

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
		//processID = fTask.getProcessID();
		if (closeAll)
			{
			aa.workflow.handleDisposition(capId,stepnumber,pStatus,dispositionDate,wfnote,pComment,systemUserObj,"Y");
			logMessage("Closing Workflow Task " + wftask + " with status " + pStatus);
			logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
			}
		else
			{
			if (!exists(wftask,taskArray))
				{
				aa.workflow.handleDisposition(capId,stepnumber,pStatus,dispositionDate,wfnote,pComment,systemUserObj,"Y");
				logMessage("Closing Workflow Task " + wftask + " with status " + pStatus);
				logDebug("Closing Workflow Task " + wftask + " with status " + pStatus);
				}
			}
		}
	}

function taskStatus(wfstr) // optional process name
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length == 2)
		{
		processName = arguments[1]; // subprocess
		useProcess = true;
		}

	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			return fTask.getDisposition()
		}
	}

function transferFunds(parentAppNum,dollarAmount)
// does fund transfer from current app to parentAppNum, but only if current app has enough non-applied funds
// needs function paymentGetNotAppliedTot()
	{
	//validate dollarAmount is number
	var checkNum = parseFloat(dollarAmount);
	if (isNaN(checkNum))
		{
		logDebug("dollarAmount parameter is not a number, no funds will be transferred");
		return false;
		}

	//check that enough non-applied funds are available
	var fundsAvail = paymentGetNotAppliedTot();
	if (fundsAvail < parseFloat(dollarAmount))
		{
		logDebug("Insufficient funds $"+fundsAvail.toString()+ " available. Fund transfer of $"+dollarAmount.toString()+" not done.");
		logMessage("Insufficient funds available. No funds transferred.");
		return false;
		}

	//enough funds - proceed with transfer
	var getCapResult = aa.cap.getCapID(parentAppNum);
	if (getCapResult.getSuccess())
		{
		var parentId = getCapResult.getOutput();

		var xferResult = aa.finance.makeFundTransfer(capId, parentId, currentUserID, "", "", sysDate, sysDate, "", sysDate, dollarAmount, "NA", "Fund Transfer", "NA", "R", null, "", "NA", "");


		if (xferResult.getSuccess())
			logDebug("Successfully did fund transfer to : " + parentAppNum);
		else
			logDebug( "**ERROR: doing fund transfer to (" + parentAppNum + "): " + xferResult.getErrorMessage());
		}
	else
		{
		logDebug( "**ERROR: getting parent cap id (" + parentAppNum + "): " + getCapResult.getErrorMessage())
		}
	}

function updateAppStatus(stat,cmt) // optional cap id
	{

	var itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args

	var updateStatusResult = aa.cap.updateAppStatus(itemCap,"APPLICATION",stat, sysDate, cmt ,systemUserObj);
	if (updateStatusResult.getSuccess())
		logDebug("Updated application status to " + stat + " successfully.");
	else
		logDebug("**ERROR: application status update to " + stat + " was unsuccessful.  The reason is "  + updateStatusResult.getErrorType() + ":" + updateStatusResult.getErrorMessage());
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


function updateShortNotes(newSN) // option CapId
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	cd = cdScriptObj.getCapDetailModel();

	cd.setShortNotes(newSN);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("updated short notes to " + newSN) }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}

function updateTask(wfstr,wfstat,wfcomment,wfnote) // optional process name, cap id
	{
	var useProcess = false;
	var processName = "";
	if (arguments.length > 4)
		{
		if (arguments[4] != "")
			{
			processName = arguments[4]; // subprocess
			useProcess = true;
			}
		}
	var itemCap = capId;
	if (arguments.length == 6) itemCap = arguments[5]; // use cap ID specified in args

	var workflowResult = aa.workflow.getTasks(itemCap);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else
	{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	if (!wfstat) wfstat = "NA";

	for (i in wfObj)
		{
		var fTask = wfObj[i];
		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
			var dispositionDate = aa.date.getCurrentDate();
			var stepnumber = fTask.getStepNumber();
			var processID = fTask.getProcessID();
			if (useProcess)
				aa.workflow.handleDisposition(itemCap,stepnumber,processID,wfstat,dispositionDate, wfnote,wfcomment,systemUserObj,"U");
			else
				aa.workflow.handleDisposition(itemCap,stepnumber,wfstat,dispositionDate,wfnote,wfcomment,systemUserObj,"U");
			logMessage("Updating Workflow Task " + wfstr + " with status " + wfstat);
			logDebug("Updating Workflow Task " + wfstr + " with status " + wfstat);
			}
		}
	}


function updateTaskAssignedDate(wfstr,wfAssignDate) // optional process name
	{
	// Update the task assignment date
	//
	var useProcess = false;
	var processName = "";
	if (arguments.length == 3)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}



	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	var wfObj = workflowResult.getOutput();
  	else
  	  	{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
   		var fTask = wfObj[i];
 		if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
			{
                        var assignDate = aa.util.now();
                        var tempDate = new Date(wfAssignDate);
                        assignDate.setTime(tempDate.getTime())
			if (assignDate)
				{
				var taskItem = fTask.getTaskItem();
				taskItem.setAssignmentDate(assignDate);

				var adjustResult = aa.workflow.adjustTaskWithNoAudit(taskItem);
                                if (adjustResult.getSuccess())
              				logDebug("Updated Workflow Task : " + wfstr + " Assigned Date to " + wfAssignDate);
                                else
                                        logDebug("Error updating wfTask : " + adjustResult.getErrorMessage());
				}
			else
				logDebug("Couldn't update assigned date.  Invalid date : " + wfAssignDate);
			}
		}
	}




function updateWorkDesc(newWorkDes)  // optional CapId
	{
	 var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args


	var workDescResult = aa.cap.getCapWorkDesByPK(itemCap);
	var workDesObj;

	if (!workDescResult.getSuccess())
		{
		//aa.print("**ERROR: Failed to get work description: " + workDescResult.getErrorMessage());
		return false;
		}

	var workDesScriptObj = workDescResult.getOutput();
	if (workDesScriptObj)
		workDesObj = workDesScriptObj.getCapWorkDesModel()
	else
		{
		//aa.print("**ERROR: Failed to get workdes Obj: " + workDescResult.getErrorMessage());
		return false;
		}


	workDesObj.setDescription(newWorkDes);
	aa.cap.editCapWorkDes(workDesObj);

	//aa.print("Updated Work Description to : " + newWorkDes);

	}
function validateGisObjects()
	{
	// returns true if the app has GIS objects that validate in GIS
	//
	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var gischk = aa.gis.getGISObjectAttributes(fGisObj[a1]);

		if (gischk.getSuccess())
			var gisres = gischk.getOutput();
		else
			{ logDebug("**ERROR: Retrieving GIS Attributes.  Reason is: " + gischk.getErrorType() + ":" + gischk.getErrorMessage()) ; return false }

		if (gisres != null)
			return true;  // we have a gis object from GIS
		}
	}

function workDescGet(pCapId)
	{
	//Gets work description
	//07SSP-00037/SP5017
	//
	var workDescResult = aa.cap.getCapWorkDesByPK(pCapId);

	if (!workDescResult.getSuccess())
		{
		logMessage("**ERROR: Failed to get work description: " + workDescResult.getErrorMessage());
		return false;
		}

	var workDescObj = workDescResult.getOutput();
	var workDesc = workDescObj.getDescription();

	return workDesc;
	}



/////////////////////
/// Custom for AD
//////////////////////

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

        var issuedDate = aa.date.parseDate(wfDate);

	newLic.setPhone1(peop.getPhone1());
	newLic.setPhone1CountryCode(peop.getPhone1CountryCode());
	newLic.setPhone2(peop.getPhone2());
	newLic.setPhone2CountryCode(peop.getPhone2CountryCode());
	newLic.setEMailAddress(peop.getEmail());
	newLic.setFax(peop.getFax());

	newLic.setAgencyCode(aa.getServiceProviderCode());
	newLic.setAuditDate(sysDate);
	newLic.setLicenseIssueDate(issuedDate);
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
		logDebug("looking at license : " + capLps[thisCapLpNum].getStateLicense());
		if (capLps[thisCapLpNum].getStateLicense().equals(rlpId))
			{
			var thisCapLp = capLps[thisCapLpNum];
			thisCapLp.setPrintFlag("Y");
			aa.licenseProfessional.editLicensedProfessional(thisCapLp);
			logDebug("Updated primary flag on Cap LP : " + rlpId);
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

function addMonthsToDate(startDate, numMonths) {
    var addYears = Math.floor(numMonths/12);
    var addMonths = numMonths - (addYears * 12);
    var newMonth = startDate.getMonth() + addMonths;
    if (startDate.getMonth() + addMonths > 11) {
      ++addYears;
      newMonth = startDate.getMonth() + addMonths - 12;
    }
    var newDate = new Date(startDate.getFullYear()+addYears,newMonth,startDate.getDate(),startDate.getHours(),startDate.getMinutes(),startDate.getSeconds());

    // adjust to correct month
    while (newDate.getMonth() != newMonth) {
      newDate = addMonthsToDate(newDate, -1);
    }

    return newDate;
}

function getLicenseCapId(licenseCapType)
	{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var capLicenses = getLicenseProfessional(itemCap);
	if (capLicenses == null || capLicenses.length == 0)
		{
		return;
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

function getLicenseProfessional(itemcapId)
{
	capLicenseArr = null;
	var s_result = aa.licenseProfessional.getLicenseProf(itemcapId);
	if(s_result.getSuccess())
	{
		capLicenseArr = s_result.getOutput();
		if (capLicenseArr == null || capLicenseArr.length == 0)
		{
			//aa.print("WARNING: no licensed professionals on this CAP:" + itemcapId);
			capLicenseArr = null;
		}
	}
	else
	{
		//aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
		capLicenseArr = null;
	}
	return capLicenseArr;
}

function stripNN(fullStr)
	{
	var allowed = "0123456789.";
	var stripped="";
	for (i = 0; i < fullStr.length() ; i++)
		if (allowed.indexOf(String.fromCharCode(fullStr.charAt(i))) >= 0)
			stripped+=String.fromCharCode(fullStr.charAt(i))
	return stripped;
	}


function right(fullStr,numChars)
	{
	var tmpStr = fullStr.toString();
	return tmpStr.substring(tmpStr.length()-numChars,tmpStr.length());
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


function copyASIFields(sourceCapId,targetCapId)  // optional groups to ignore
	{
	var ignoreArray = new Array();
	for (var i=2; i<arguments.length;i++)
		ignoreArray.push(arguments[i])

	var targetCap = aa.cap.getCap(targetCapId).getOutput();
	var targetCapType = targetCap.getCapType();
	var targetCapTypeString = targetCapType.toString();
	var targetCapTypeArray = targetCapTypeString.split("/");

	var sourceASIResult = aa.appSpecificInfo.getByCapID(sourceCapId)

	if (sourceASIResult.getSuccess())
		{ var sourceASI = sourceASIResult.getOutput(); }
	else
		{ //aa.print( "**ERROR: getting source ASI: " + sourceASIResult.getErrorMessage()); 
		return false; }

	for (ASICount in sourceASI)
		  {
		  thisASI = sourceASI[ASICount];

		  if (!exists(thisASI.getCheckboxType(),ignoreArray))
		       {
		       thisASI.setPermitID1(targetCapId.getID1())
		       thisASI.setPermitID2(targetCapId.getID2())
		       thisASI.setPermitID3(targetCapId.getID3())
		       thisASI.setPerType(targetCapTypeArray[1])
		       thisASI.setPerSubType(targetCapTypeArray[2])
		       aa.cap.createCheckbox(thisASI)
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



function deleteTask(targetCapId,deleteTaskName)
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
	var result = aa.workflow.removeTask(tTask)

	if (!result.getSuccess())
		{ logDebug("error " + result.getErrorMessage()); return false; }

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



function executeASITable(tableArray)
	{
	// Executes an ASI table as if it were script commands
	// No capability for else or continuation statements
	// Assumes that there are at least three columns named "Enabled", "Criteria", "Action"
	// Will replace tokens in the controls

	//var thisDate = new Date();
	//var thisTime = thisDate.getTime();
	//logDebug("Executing ASI Table, Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")

	for (xx in tableArray)
		{

		var doTableObj = tableArray[xx];
		var myCriteria = doTableObj["Criteria"]; //aa.print("cri: " + myCriteria)
		var myAction = doTableObj["Action"];  //aa.print("act: " + myAction)
		//aa.print("enabled: " + doTableObj["Enabled"])

		if (doTableObj["Enabled"] == "Yes")
			if (eval(token(myCriteria)))
				eval(token(myAction));

		} // next action
	//var thisDate = new Date();
	//var thisTime = thisDate.getTime();
	//logDebug("Finished executing ASI Table, Elapsed Time: "  + ((thisTime - startTime) / 1000) + " Seconds")
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


function closeSubWorkflow(thisProcessID,wfStat) // optional capId
	{
	var itemCap = capId;
	if (arguments.length == 3) itemCap = arguments[2]; // use cap ID specified in args


	var isCompleted = true;

	var workflowResult = aa.workflow.getTasks(itemCap);
	if (workflowResult.getSuccess())
		var wfObj = workflowResult.getOutput();
	else
		{ logMessage("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

	for (i in wfObj)
		{
		var fTaskSM = wfObj[i];
		if (fTaskSM.getProcessID() == thisProcessID && fTaskSM.getCompleteFlag() != "Y")
			{
			logDebug("closeSubWorkflow: found an incomplete task processID #" + thisProcessID + " , Step# " + fTaskSM.getStepNumber(),3);
			isCompleted = false
			}
		}

	if (!isCompleted) return false;


	// get the parent task

	var relationArray = aa.workflow.getProcessRelationByCapID(itemCap,null).getOutput()

	var relRecord = null;

	for (thisRel in relationArray)
		if (relationArray[thisRel].getProcessID() == thisProcessID)
			relRecord = relationArray[thisRel];

	if (!relRecord)
		{
		logDebug("closeSubWorkflow: did not find a process relation, exiting",3);
		return false;
		}

	logDebug("executing handleDisposition:" + relRecord.getStepNumber() + "," + relRecord.getParentProcessID() + "," + wfStat,3);

	var handleResult = aa.workflow.handleDisposition(itemCap,relRecord.getStepNumber(),relRecord.getParentProcessID(),wfStat,sysDate,"Closed via script","Closed via script",systemUserObj ,"Y");

	if (!handleResult.getSuccess())
		logDebug("**WARNING: closing parent task: " + handleResult.getErrorMessage());
	else
		logDebug("Closed parent task");
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

function replaceMessageTokens(m)
	{
	//  tokens in pipes will attempt to interpret as script variables
	//  tokens in curly braces will attempt to replace from AInfo (ASI, etc)
	//
	//  e.g.   |capId|  or |wfTask|  or |wfStatus|
	//
	//  e.g.   {Expiration Date}  or  {Number of Electrical Outlets}
	//
	//  e.g.   m = "Your recent license application (|capIdString|) has successfully passed |wfTask| with a status of |wfStatus|"

	while (m.indexOf("|"))
	  {
	  var s = m.indexOf("|")
	  var e = m.indexOf("|",s+1)
	  if (e <= 0) break; // unmatched
	  var r = m.substring(s+1,e)

	  var evalstring = "typeof(" + r + ") != \"undefined\" ? " + r + " : \"undefined\""
	  var v = eval(evalstring)
	  var pattern = new RegExp("\\|" + r + "\\|","g")
	  m = String(m).replace(pattern,v)
	  }

	while (m.indexOf("{"))
	  {
	  var s = m.indexOf("{")
	  var e = m.indexOf("}",s+1)
	  if (e <= 0) break; // unmatched
	  var r = m.substring(s+1,e)

	  var evalstring = "AInfo[\"" + r + "\"]"
	  var v = eval(evalstring)
	  var pattern = new RegExp("\\{" + r + "\\}","g")
	  m = String(m).replace(pattern,v)

	  }

	 return m
	 }

function addStdCondition(cType,cDesc)
	{

	if (!aa.capCondition.getStandardConditions)
		{
		//aa.print("addStdCondition function is not available in this version of Accela Automation.");
		}
        else
		{
		standardConditions = aa.capCondition.getStandardConditions(cType,cDesc).getOutput();
		for(i = 0; i<standardConditions.length;i++)
			{
			standardCondition = standardConditions[i]
			aa.capCondition.createCapConditionFromStdCondition(capId, standardCondition.getConditionNbr())
			}
		}
	}

function invoiceFee(fcode,fperiod)
    {
    //invoices all assessed fees having fcode and fperiod
    // SR5085 LL
    var feeFound=false;
	var invFeeSeqList = new Array();
	var invPaymentPeriodList = new Array();

    getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
    if (getFeeResult.getSuccess())
        {
        var feeList = getFeeResult.getOutput();
        for (feeNum in feeList)
			if (feeList[feeNum].getFeeitemStatus().equals("NEW"))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();
				invFeeSeqList.push(feeSeq);
				invPaymentPeriodList.push(fperiod);
                feeFound=true;
                logDebug("Assessed fee "+fcode+" found and tagged for invoicing");
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
    else
		{ logDebug( "**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())}

    return feeFound;
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


function loadFees()  // option CapId
	{
	//  load the fees into an array of objects.  Does not
	var itemCap = capId
	if (arguments.length > 0)
		{
		ltcapidstr = arguments[0]; // use cap ID specified in args
		if (typeof(ltcapidstr) == "string")
                {
				var ltresult = aa.cap.getCapID(ltcapidstr);
	 			if (ltresult.getSuccess())
  				 	itemCap = ltresult.getOutput();
	  			else
  				  	{ //aa.print("**ERROR: Failed to get cap ID: " + ltcapidstr + " error: " +  ltresult.getErrorMessage()); 
					return false; }
                }
		else
			itemCap = ltcapidstr;
		}

	//aa.print("loading fees for cap " + itemCap.getCustomID());
  	var feeArr = new Array();

	var feeResult=aa.fee.getFeeItems(itemCap);
		if (feeResult.getSuccess())
			{ var feeObjArr = feeResult.getOutput(); }
		else
			{ //aa.print( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); 
			return false; }

		for (ff in feeObjArr)
			{
			fFee = feeObjArr[ff];
			var myFee = new Fee();
			var amtPaid = 0;

			var pfResult = aa.finance.getPaymentFeeItems(itemCap, null);
			if (pfResult.getSuccess())
				{
				var pfObj = pfResult.getOutput();
				for (ij in pfObj)
					if (fFee.getFeeSeqNbr() == pfObj[ij].getFeeSeqNbr())
						amtPaid+=pfObj[ij].getFeeAllocation()
				}

			myFee.sequence = fFee.getFeeSeqNbr();
			myFee.code =  fFee.getFeeCod();
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
			myFee.calcFlag = fFee.getCalcFlag();;
			myFee.calcProc = fFee.getFeeCalcProc();

			feeArr.push(myFee)
			}

		return feeArr;
		}


//////////////////

function Fee() // Fee Object
	{
	this.sequence = null;
	this.code =  null;
	this.sched = null;
	this.description = null;  // getFeeDescription()
	this.unit = null; //  getFeeUnit()
	this.amount = null; //  getFee()
	this.amountPaid = null;
	this.applyDate = null; // getApplyDate()
	this.effectDate = null; // getEffectDate();
	this.expireDate = null; // getExpireDate();
	this.status = null; // getFeeitemStatus()
	this.recDate = null;
	this.period = null; // getPaymentPeriod()
	this.display = null; // getDisplay()
	this.accCodeL1 = null; // getAccCodeL1()
	this.accCodeL2 = null; // getAccCodeL2()
	this.accCodeL3 = null; // getAccCodeL3()
	this.formula = null; // getFormula()
	this.udes = null; // String getUdes()
	this.UDF1 = null; // getUdf1()
	this.UDF2 = null; // getUdf2()
	this.UDF3 = null; // getUdf3()
	this.UDF4 = null; // getUdf4()
	this.subGroup = null; // getSubGroup()
	this.calcFlag = null; // getCalcFlag();
	this.calcProc = null; // getFeeCalcProc()
	this.auditDate = null; // getAuditDate()
	this.auditID = null; // getAuditID()
	this.auditStatus = null; // getAuditStatus()
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
		}  // function

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

function getChildTasks(taskName) {
    var childTasks = new Array();
    var childId = null;
    var itemCap = capId
    if (arguments.length > 1)
        itemCap = arguments[1]; // use cap ID specified in args

    var workflowResult = aa.workflow.getTasks(itemCap);
    var wfObj = workflowResult.getOutput();
    for (i in wfObj) {
        var fTaskSM = wfObj[i];
        if (fTaskSM.getTaskDescription().equals(taskName)) {
            var relationArray = aa.workflow.getProcessRelationByCapID(itemCap, null).getOutput()
            for (thisRel in relationArray) {
                y = relationArray[thisRel]
                if (y.getParentTaskName() && y.getParentTaskName().equals(fTaskSM.getTaskDescription()))
                    childId = y.getProcessID()
            }
        }
    }

    for (i in wfObj) {
        var fTaskSM = wfObj[i];
        if (fTaskSM.getProcessID() == childId)
            childTasks.push(fTaskSM)
    }

    return childTasks;

}

function addFeeWithExtraData(fcode, fsched, fperiod, fqty, finvoice, feeCap, feeComment, UDF1, UDF2) {
    var feeCapMessage = "";
    var feeSeq_L = new Array(); 			// invoicing fee for CAP in args
    var paymentPeriod_L = new Array(); 		// invoicing pay periods for CAP in args

    assessFeeResult = aa.finance.createFeeItem(feeCap, fsched, fcode, fperiod, fqty);
    if (assessFeeResult.getSuccess()) {
        feeSeq = assessFeeResult.getOutput();
        logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
        logDebug("The assessed fee Sequence Number " + feeSeq + feeCapMessage);

        fsm = aa.finance.getFeeItemByPK(feeCap, feeSeq).getOutput().getF4FeeItem();

        if (feeComment) fsm.setFeeNotes(feeComment);
        if (UDF1) fsm.setUdf1(UDF1);
        if (UDF2) fsm.setUdf2(UDF2);

        aa.finance.editFeeItem(fsm)


        if (finvoice == "Y" && arguments.length == 5) // use current CAP
        {
            feeSeqList.push(feeSeq);
            paymentPeriodList.push(fperiod);
        }
        if (finvoice == "Y" && arguments.length > 5) // use CAP in args
        {
            feeSeq_L.push(feeSeq);
            paymentPeriod_L.push(fperiod);
            var invoiceResult_L = aa.finance.createInvoice(feeCap, feeSeq_L, paymentPeriod_L);
            if (invoiceResult_L.getSuccess())
                logMessage("Invoicing assessed fee items is successful.");
            else
                logDebug("**ERROR: Invoicing the fee items assessed was not successful.  Reason: " + invoiceResult.getErrorMessage());
        }
    }
    else {
        logDebug("**ERROR: assessing fee (" + fcode + "): " + assessFeeResult.getErrorMessage());
        return null;
    }

    return feeSeq;

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


function createLicenseSearchEntries(itemCapId) {
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
			entityType: 'TRADELICENSE'
			});


            index++;
        }
        aa.specialSearch.removeSearchDataByCapID(itemCapId);
        aa.specialSearch.createBatchSearchData(searchDataList);
    }
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

function updateTaskDepartment(wfstr,wfDepartment) // optional process name
	{
	// Update the task assignment department
	//
	var useProcess = false;
	var processName = "";
	if (arguments.length == 3)
		{
		processName = arguments[2]; // subprocess
		useProcess = true;
		}


        var assignBureau = "" + wfDepartment.split("/")[2];
	var assignDivision = "" + wfDepartment.split("/")[3];
	var workflowResult = aa.workflow.getTasks(capId);
 	if (workflowResult.getSuccess())
  	 	wfObj = workflowResult.getOutput();
  	else
  	  	{ logDebug("**ERROR: Failed to get workflow object: " + s_capResult.getErrorMessage()); return false; }

        for (var i in wfObj)
		{
   		fTask = wfObj[i];
                if (fTask.getTaskDescription().toUpperCase().equals(wfstr.toUpperCase())  && (!useProcess || fTask.getProcessCode().equals(processName)))
 			{
			if (wfDepartment)
				{
				var taskUserObj = fTask.getTaskItem().getAssignedUser()
				taskUserObj.setBureauCode(assignBureau);
				taskUserObj.setDivisionCode(assignDivision);
				fTask.setAssignedUser(taskUserObj);
        			var taskItem = fTask.getTaskItem();

				var adjustResult = aa.workflow.assignTask(taskItem);
                                if (adjustResult.getSuccess())
              				logDebug("Updated Workflow Task : " + wfstr + " Department Set to " + assignBureau);
                                else
                                        logDebug("Error updating wfTask : " + adjustResult.getErrorMessage());
				}
			else
				logDebug("Couldn't update Department.  Invalid department : " + assignBureau);
			}
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

function removeAllFees(itemCap) // Removes all non-invoiced fee items for a CAP ID
	{
	getFeeResult = aa.finance.getFeeItemByCapID(itemCap);
	if (getFeeResult.getSuccess())
		{
		var feeList = getFeeResult.getOutput();
		for (feeNum in feeList)
			{
			if (feeList[feeNum].getFeeitemStatus().equals("NEW"))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();

				var editResult = aa.finance.removeFeeItem(itemCap, feeSeq);
				if (editResult.getSuccess())
					{
					logDebug("Removed existing Fee Item: " + feeList[feeNum].getFeeCod());
					}
				else
					{ logDebug( "**ERROR: removing fee item (" + feeList[feeNum].getFeeCod() + "): " + editResult.getErrorMessage()); break }
				}
			if (feeList[feeNum].getFeeitemStatus().equals("INVOICED"))
				{
				logDebug("Invoiced fee "+feeList[feeNum].getFeeCod()+" found, not removed");
				}
			}
		}
	else
		{ logDebug( "**ERROR: getting fee items (" + feeList[feeNum].getFeeCod() + "): " + getFeeResult.getErrorMessage())}

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

function addCustomFee(feeSched, feeCode, feeDescr, feeAm, feeAcc) {
//6th optional parameter feeAcc3 to set AccountCode 3.
//7th optional parameter shortnotes

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
	if ("Federal".equals(newFee.getSubGroup())) newFee.setUdes("Federal");
 	
	aa.finance.editFeeItem(newFee);
      }
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
function getLastContactAmendments(customId)
{
	//fish 01/25/2011
	//customId as amendment CAP
	//Returns a string with the delta between an amendment CAP and its parent license CAP
	
	var result = "";
	var found = false;
	var capId = aa.cap.getCapID(customId).getOutput();
	var parentCapId = getParent(capId);
	var capContactArray = aa.people.getCapContactByCapID(capId);
    var parentCapContactArray = aa.people.getCapContactByCapID(parentCapId);
	
	if (!capContactArray.getSuccess())
	{
		logDebug("**ERROR: Problem getting CapID " + capContactArray.getErrorMessage())
	}
	else
	{
		capContactArray = capContactArray.getOutput();
	}
	
		if (!parentCapContactArray.getSuccess())
	{
		logDebug("**ERROR: Problem getting CapID " + parentCapContactArray.getErrorMessage())
	}
	else
	{
		parentCapContactArray = parentCapContactArray.getOutput();
	}
	
	for(c in capContactArray)
	{
		found = false;
		for (p in parentCapContactArray)
		{
			if(capContactArray[c].getCapContactModel().getRefContactNumber().equals(parentCapContactArray[p].getCapContactModel().getRefContactNumber()))
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
							if(!attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue))
							{
								result+="[Partners Share Amendment]:: Contact " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + " from " + attributesCN[n].attributeValue + "% to " + attributesCA[a].attributeValue + "%\n";
							}
						}
						else if(attributesCA[a].attributeName.equals("NATIONALITY") && attributesCN[n].attributeName.equals("NATIONALITY"))
						{
							if(!attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue))
							{
								result+="[Partners Nationality Amendment]:: Contact " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + " from " + attributesCN[n].attributeValue + " to " + attributesCA[a].attributeValue + "\n";
							}
						}
						else if(attributesCA[a].attributeName.equals("REPRESENTATIVE TYPE") && attributesCN[n].attributeName.equals("REPRESENTATIVE TYPE"))
						{
							if(!attributesCA[a].attributeValue.equals(attributesCN[n].attributeValue))
							{
								result+="[Partners Amendment]:: Contact " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + " from " + attributesCN[n].attributeValue + " to " + attributesCA[a].attributeValue + "\n";
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
			}
			if(repType.equals("Manager"))
			{
				result+="[Manager Amendment]:: Added manager " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + "\n";
			}
			else if(repType.equals("Heirs Representative"))
			{
				result+="[Heirs/Commissioner Amendment]:: Added heir " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + "\n";
			}
			else if(repType.equals("Commissioner to Sign"))
			{
				result+="[Heirs/Commissioner Amendment]:: Added Commissioner to Sign " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + "\n";			
			}
			else if(repType.equals("Sponsor"))
			{
				result+="[Sponsor Amendment]:: Added sponsor " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + "\n";
			}
			else
			{
				result+="[Partners Amendment]:: Added contact " + capContactArray[c].getPeople().getFirstName() + " " + capContactArray[c].getPeople().getLastName() + "\n";
			}
		}
	}
	for(p in parentCapContactArray)
	{
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
			for(p in parentCapContactArray[p].getPeople().getAttributes().toArray())
			{
				if(parentCapContactArray[p].getPeople().getAttributes().toArray()[x].attributeName.equals("REPRESENTATIVE TYPE"))
				{
					repType = parentCapContactArray[p].getPeople().getAttributes().toArray()[x].attributeValue;
				}				
			}
			if(repType.equals("Manager"))
			{
				result+="[Manager Amendment]:: Removed manager " + parentCapContactArray[p].getPeople().getFirstName() + " " + parentCapContactArray[p].getPeople().getLastName() + "\n";
			}
			else if(repType.equals("Heirs Representative"))
			{
				result+="[Heirs/Commissioner Amendment]:: Removed heir " + parentCapContactArray[p].getPeople().getFirstName() + " " + parentCapContactArray[p].getPeople().getLastName() + "\n";
			}
			else if(repType.equals("Commissioner to Sign"))
			{
				result+="[Heirs/Commissioner Amendment]:: Removed Commissioner to Sign " + parentCapContactArray[p].getPeople().getFirstName() + " " + parentCapContactArray[p].getPeople().getLastName() + "\n";			
			}
			else if(repType.equals("Sponsor"))
			{
				result+="[Sponsor Amendment]:: Removed sponsor " + parentCapContactArray[p].getPeople().getFirstName() + " " + parentCapContactArray[p].getPeople().getLastName() + "\n";
			}
			else
			{
				result+="[Partners Amendment]:: Removed contact " + parentCapContactArray[p].getPeople().getFirstName() + " " + parentCapContactArray[p].getPeople().getLastName() + "\n";
			}		
		}
	}
return result;
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
		if(fees[x]["Main Area"].fieldValue && !fees[x]["Main Area"].fieldValue.equals(capCity)) 
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
		if(fees[x]["Main Area"].fieldValue && !fees[x]["Main Area"].fieldValue.equals(capCity)) continue;
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
	newFee.setUdes(originalFee["Type"].fieldValue);
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
			}			
		}
		logDebug("There are " + aeArray.length + " Approvals");
		if (aeArray.length == 0) deleteTaskAndSub(capId, "Approving Entities");
		
		/** End Remove **/			
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

	mobileEmail = getAppSpecific("Email Address", tempCap);
	if (mobileEmail) 
	{
		emailTo += mobileEmail + ";";
	}

	if (!conArr.length && !mobileEmail)
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

