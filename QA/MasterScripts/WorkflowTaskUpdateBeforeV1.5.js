/*------------------------------------------------------------------------------------------------------/
| SVN $Id: WorkflowTaskUpdateBefore.js 3600 2008-10-27 21:36:24Z dane.quatacker $
| Program : WorkflowTaskUpdateBeforeV1.5.js
| Event   : WorkflowTaskUpdateBefore
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A
| Action# : N/A
|
| Notes   : Requires the TaskSpecificInfoModels parameter on this event.
|	    11/28/10 - DQ - updated removeASITable
	    12/3/10 - DQ  - removed aa.print()	
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false;			// Set to true to see results in popup window
var mslogDir = "C:\\Accela72\\av.biz\\log\\" + aa.env.getValue("CurrentUserID") + "\\" + aa.date.getCurrentDate().getDayOfMonth() + "-" + aa.date.getCurrentDate().getMonth() + "-" + aa.date.getCurrentDate().getYear() + ".html";
var showDebug = true;				// Set to true to see debug messages in popup window
var controlString = "WorkflowTaskUpdateBefore"; // Standard choice for control
var preExecute = "PreExecuteForAfterEvents"
var cancel = false ; 				// Setting cancel to true in standard choices will cancel the event
var documentOnly = false;			// Document Only -- displays hierarchy of std choice steps
var disableTokens = false;			// turn off tokenizing of App Specific and Parcel Attributes
var useAppSpecificGroupName = false;		// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;		// Use Group name when populating Task Specific Info Values
var enableVariableBranching = false;					// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;				// Maximum number of std choice entries.  Must be Left Zero Padded
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";							// Message String
var debug = "";								// Debug String
var br = "<BR>";							// Break Tag
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
var currentUserID = aa.env.getValue("CurrentUserID");   		// Current User
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
var wfTSI = aa.env.getValue("TaskSpecificInfoModels");	// Workflow Task Specific Info Array
logDebug("TSIM = " + wfTSI);
var wfDate = aa.env.getValue("WorkflowStatusDate");	// Workflow Task Date
var wfTask = aa.env.getValue("WorkflowTask");		// Workflow Task Triggered event
var wfStatus = aa.env.getValue("WorkflowStatus");	// Status of workflow that triggered event
var wfLastName = aa.env.getValue("StaffLastName");
var wfFirstName = aa.env.getValue("StaffFirstName");
var wfMiddleName = aa.env.getValue("StaffMiddleName");
var wfProcessID = aa.env.getValue("ProcessID");
if (wfMiddleName.length() == 0) wfMiddleName = null;
var wfUserObj = aa.person.getUser(wfFirstName,wfMiddleName,wfLastName).getOutput();
var wfUserId = " ";
if (wfUserObj) wfUserId = wfUserObj.getUserID();
var wfDateMMDDYYYY = wfDate.substr(5,2) + "/" + wfDate.substr(8,2) + "/" + wfDate.substr(0,4);	// date of status of workflow that triggered event in format MM/DD/YYYY
var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"YYYY-MM-DD");
var wfStep ; var wfDue ; var wfProcess ; 		// Initialize

var wfObj = aa.workflow.getTasks(capId).getOutput();
for (i in wfObj)
	{
	fTask = wfObj[i];
	if (fTask.getTaskDescription().equals(wfTask) && (fTask.getProcessID() == wfProcessID))
		{
		wfStep = fTask.getStepNumber();
		wfProcess = fTask.getProcessCode();
		wfDue = fTask.getDueDate();
		wfTaskObj = fTask
		}
	}

if (wfTSI != "")
	{
	for (TSIm in wfTSI)
		{
		if (useTaskSpecificGroupName)
			AInfo["Updated." + wfProcess + "." + wfTask + "." + wfTSI[TSIm].getCheckboxDesc()] = wfTSI[TSIm].getChecklistComment();
		else
			AInfo["Updated." + wfTSI[TSIm].getCheckboxDesc()] = wfTSI[TSIm].getChecklistComment();
		}
	}


logDebug("wfDate = " + wfDate);
logDebug("wfDateMMDDYYYY = " + wfDateMMDDYYYY);
logDebug("wfTask = " + wfTask);
logDebug("wfStep = " + wfStep);
logDebug("wfProcess = " + wfProcess);
logDebug("wfStatus = " + wfStatus);
logDebug("wfUserId = " + wfUserId);
logDebug("wfTaskObj = " + wfTaskObj.getClass());
/*----------------------------------------------------------------as--------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

if (preExecute.length) doStandardChoiceActions(preExecute,true,0); 	// run Pre-execution code

logGlobals(AInfo);
/*------------------------------------------------------------------------------------------------------/
| <===========Main=Loop================>
|
/-----------------------------------------------------------------------------------------------------*/
//
//  Get the Standard choices entry we'll use for this App type
//  Then, get the action/criteria pairs for this app
//

doStandardChoiceActions(controlString,true,0);
//
// Check for invoicing of fees
//
if (feeSeqList.length)
	{
	invoiceResult = aa.finance.createInvoice(capId, feeSeqList, paymentPeriodList);
	if (invoiceResult.getSuccess())
		logMessage("Invoicing assessed fee items is successful.");
	else
		logMessage("**ERROR: Invoicing the fee items assessed to app # " + appId + " was not successful.  Reason: " +  invoiceResult.getErrorMessage());
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
	if (cancel)
		{
		aa.env.setValue("ScriptReturnCode", "1");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", "<font color=red><b>Action Cancelled</b></font><br><br>" + debug);
		}
	else
		{
		aa.env.setValue("ScriptReturnCode", "0");
		if (showMessage) aa.env.setValue("ScriptReturnMessage", message);
		if (showDebug) 	aa.env.setValue("ScriptReturnMessage", debug);
		}
	}


/*------------------------------------------------------------------------------------------------------/
| <===========Internal Functions and Classes (Used by this script)
/------------------------------------------------------------------------------------------------------*/

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

function doStandardChoiceActions(stdChoiceEntry, doExecution, docIndent) {
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    var lastEvalTrue = false;
    logDebug("Executing: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")

    var pairObjArray = getScriptAction(stdChoiceEntry);
    if (!doExecution) docWrite(stdChoiceEntry, true, docIndent);
    for (xx in pairObjArray) {
        doObj = pairObjArray[xx];
        if (doExecution) {
            if (doObj.enabled) {
                logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Criteria : " + doObj.cri, 2)

                if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation)) {
                    logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Action : " + doObj.act, 2)

                    eval(token(doObj.act));
                    lastEvalTrue = true;
                }
                else {
                    if (doObj.elseact) {
                        logDebug(aa.env.getValue("CurrentUserID") + " : " + stdChoiceEntry + " : #" + doObj.ID + " : Else : " + doObj.elseact, 2)
                        eval(token(doObj.elseact));
                    }
                    lastEvalTrue = false;
                }
            }
        }
        else // just document
        {
            docWrite("|  ", false, docIndent);
            var disableString = "";
            if (!doObj.enabled) disableString = "<DISABLED>";

            if (doObj.elseact)
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act + " ^ " + doObj.elseact, false, docIndent);
            else
                docWrite("|  " + doObj.ID + " " + disableString + " " + doObj.cri + " ^ " + doObj.act, false, docIndent);

            for (yy in doObj.branch) {
                doStandardChoiceActions(doObj.branch[yy], false, docIndent + 1);
            }
        }
    } // next sAction
    if (!doExecution) docWrite(null, true, docIndent);
    var thisDate = new Date();
    var thisTime = thisDate.getTime();
    logDebug("Finished: " + stdChoiceEntry + ", Elapsed Time: " + ((thisTime - startTime) / 1000) + " Seconds")
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



function logDebug(dstr) {

aa.util.writeToFile(sysDate.getHourOfDay() + ":" + sysDate.getMinute() + ":" + sysDate.getSecond() + " " + dstr + "<Br>", mslogDir);

    vLevel = 1
    if (arguments.length > 1)
        vLevel = arguments[1]

    if ((showDebug & vLevel) == vLevel || vLevel == 1)
        debug += dstr + br;

    if ((showDebug & vLevel) == vLevel)
        aa.debug(aa.getServiceProviderCode() + " : " + aa.env.getValue("CurrentUserID"), dstr)

}


function logMessage(dstr)
	{
	message+=dstr + br;
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
	var addCapCondResult = aa.capCondition.addCapCondition(capId, cType, cDesc, cComment, sysDate, null, sysDate, null,null, cImpact, systemUserObj, systemUserObj, cStatus, currentUserID, "A")
        if (addCapCondResult.getSuccess())
        	{
		//aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		//aa.print("Successfully added condition (" + cImpact + ") " + cDesc);
		}
	else
		{
		//aa.print( "**ERROR: adding condition (" + cImpact + "): " + addCapCondResult.getErrorMessage());
		}
	}



  function addASITable(tableName,tableValueArray) // optional capId
  	{

	//aa.print("tableValueArray "+tableValueArray);
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

			logDebug("Table: " + tableName + " Row:" + thisrow + " Column: " + colname.getColumnName() + " Value: " + tableValueArray[thisrow][colname.getColumnName()]);
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


function addFee(fcode,fsched,fperiod,fqty,finvoice) // Adds a single fee, optional argument: fCap
	{
	// Updated Script will return feeSeq number or null if error encountered (SR5112)
	var feeCap = capId;
	var feeCapMessage = "";
	var feeSeq_L = new Array();				// invoicing fee for CAP in args
	var paymentPeriod_L = new Array();			// invoicing pay periods for CAP in args
	var feeSeq = null;
	if (arguments.length > 5)
		{
		feeCap = arguments[5]; // use cap ID specified in args
		feeCapMessage = " to specified CAP";
		}

	assessFeeResult = aa.finance.createFeeItem(feeCap,fsched,fcode,fperiod,fqty);
	if (assessFeeResult.getSuccess())
		{
		feeSeq = assessFeeResult.getOutput();
		logMessage("Successfully added Fee " + fcode + ", Qty " + fqty + feeCapMessage);
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
		feeSeq = null;
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



function addStdCondition(cType,cDesc)
	{

	if (!aa.capCondition.getStandardConditions)
		{
		logDebug("addStdCondition function is not available in this version of Accela Automation.");
		}
        else
		{
		standardConditions = aa.capCondition.getStandardConditions(cType,cDesc).getOutput();
		for(i = 0; i<standardConditions.length;i++)
			{
			standardCondition = standardConditions[i]
			var addCapCondResult = aa.capCondition.addCapCondition(capId, standardCondition.getConditionType(), standardCondition.getConditionDesc(), standardCondition.getConditionComment(), sysDate, null, sysDate, null, null, standardCondition.getImpactCode(), systemUserObj, systemUserObj, "Applied", currentUserID, "A")
	        	if (addCapCondResult.getSuccess())
	        		{
				logMessage("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
				logDebug("Successfully added condition (" + standardCondition.getConditionDesc() + ")");
				}
			else
				{
				logDebug( "**ERROR: adding condition (" + standardCondition.getConditionDesc() + "): " + addCapCondResult.getErrorMessage());
				}
			}
		}
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
	}
function assignInspection(iNumber,iName)
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
		{ logDebug("**ERROR retrieving inspection " + iNumber + " : " + iObjResult.getErrorMessage()) ; return false ; }

	iObj = iObjResult.getOutput();


	inspTypeResult = aa.inspection.getInspectionType(iObj.getInspection().getInspectionGroup(), iObj.getInspectionType())

	if (!inspTypeResult.getSuccess())
		{ logDebug("**ERROR retrieving inspection Type " + inspTypeResult.getErrorMessage()) ; return false ; }

	inspTypeArr = inspTypeResult.getOutput();

        if (inspTypeArr == null || inspTypeArr.length == 0)
		{ logDebug("**ERROR no inspection type found") ; return false ; }

	inspType = inspTypeArr[0]; // assume first

	inspSeq = inspType.getSequenceNumber();

	inspSchedDate = iObj.getScheduledDate().getYear() + "-" + iObj.getScheduledDate().getMonth() + "-" + iObj.getScheduledDate().getDayOfMonth()

 	logDebug(inspSchedDate)

	iout =  aa.inspection.autoAssignInspector(capId.getID1(),capId.getID2(),capId.getID3(), inspSeq, inspSchedDate)

	if (!iout.getSuccess())
		{ logDebug("**ERROR retrieving auto assign inspector " + iout.getErrorMessage()) ; return false ; }

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

	}
function capHasExpiredLicProf(pDateType, pLicType, pCapId)
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
	}
function capIdsFilterByFileDate(pCapIdArray, pStartDate, pEndDate)
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
	}
function capIdsGetByAddr ()
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
	}
function capIdsGetByParcel(pParcelNum)
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


function completeCAP(userId) // option CapId
{
	var itemCap = capId
	if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ 	logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage());
			return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ 	logDebug("**ERROR: No cap detail script object") ;
			return false; }

	cd = cdScriptObj.getCapDetailModel();

	iNameResult  = aa.person.getUser(userId);

	if (!iNameResult.getSuccess())
		{ 	logDebug("**ERROR retrieving  user model " + userId + " : " + iNameResult.getErrorMessage()) ;
			return false ; }

	iName = iNameResult.getOutput();

	cd.setCompleteDept(iName.getDeptOfUser());
	cd.setCompleteStaff(userId);
	cdScriptObj.setCompleteDate(sysDate);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
	{
		logDebug("Set CAP *Completed by Staff* to " + userId) + "\nSet CAP *Completed by Dept* " + iName.getDeptOfUser() + "\nSet CAP *Completed Date* " + sysDate.toString();
	}
	else
	{
		logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ;
		return false ;
	}
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
	var capAddressResult = aa.address.getAddressByCapId(pFromCapId);
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
			aa.address.createAddress(newAddress);
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
function copyAppSpecific(newCap) // copy all App Specific info into new Cap
	{
	for (asi in AInfo)
	  	editAppSpecific(asi,AInfo[asi],newCap)
	}


function copyASIFields(sourceCapId,targetCapId)  // optional fields to ignore
	{
	var ignoreArray = new Array();
	for (var i=1; i<arguments.length;i++)
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

function copyCalcVal(fromcap,newcap)
	{
	// 8/8/2008 JHS  creatBCalcValuatn method began using the script model after 6.4  updated this function
	if (!newcap)
		{ logMessage("**WARNING: copyCalcVal was passed a null new cap ID"); return false; }

	var valResult = aa.finance.getCalculatedValuation(fromcap,null);
	if (valResult.getSuccess())
		var valArray = valResult.getOutput();
	else
		{ logMessage("**ERROR: Failed to get calc val array: " + valResult.getErrorMessage()); return false; }

	for (thisCV in valArray)
		{
		var bcv = valArray[thisCV];
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

function copyContacts(pFromCapId, pToCapId)
	{
	//Copies all contacts from pFromCapId to pToCapId
	//07SSP-00037/SP5017
	//
	if (pToCapId==null)
		var vToCapId = capId;
	else
		var vToCapId = pToCapId;

	var capContactResult = aa.people.getCapContactByCapID(pFromCapId);
	var copied = 0;
	if (capContactResult.getSuccess())
		{
		var Contacts = capContactResult.getOutput();
		for (yy in Contacts)
			{
			var newContact = Contacts[yy].getCapContactModel();
			newContact.setCapID(vToCapId);
			aa.people.createCapContact(newContact);
			copied++;
			logDebug("Copied contact from "+pFromCapId.getCustomID()+" to "+vToCapId.getCustomID());
			}
		}
	else
		{
		logMessage("**ERROR: Failed to get contacts: " + capContactResult.getErrorMessage());
		return false;
		}
	return copied;
	}
function copyFees(sourceCapId,targetCapId)
	{

	var feeSeqArray = new Array();
	var invoiceNbrArray = new Array();
	var feeAllocationArray = new Array();

	var feeA = loadFees(sourceCapId)

	for (x in feeA)
		{
		thisFee = feeA[x];

		logMessage("We have a fee " + thisFee.code + " status : " + thisFee.status);

		if (thisFee.status == "INVOICED")
			{
			addFee(thisFee.code,thisFee.sched,thisFee.period,thisFee.unit,"Y",targetCapId)

			var feeSeqArray = new Array();
			var paymentPeriodArray = new Array();

			feeSeqArray.push(thisFee.sequence);
			paymentPeriodArray.push(thisFee.period);
			var invoiceResult_L = aa.finance.createInvoice(sourceCapId, feeSeqArray, paymentPeriodArray);

			if (!invoiceResult_L.getSuccess()){
				//aa.print("**ERROR: Invoicing the fee items voided " + thisFee.code + " was not successful.  Reason: " +  invoiceResult_L.getErrorMessage());
				}
			}


		if (thisFee.status == "NEW")
			{
			addFee(thisFee.code,thisFee.sched,thisFee.period,thisFee.unit,"N",targetCapId)
			}

		}

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
	}
function copySchedInspections(pFromCapId, pToCapId)
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
	newLic.setContactFirstName(licProfScriptModel.getContactFirstName());
	newLic.setContactLastName(licProfScriptModel.getContactLastName());
	newLic.setContactMiddleName(licProfScriptModel.getContactMiddleName());
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


function dateFormatted(pMonth,pDay,pYear,pFormat)
//returns date string formatted as YYYY-MM-DD or MM/DD/YYYY (default)
	{
	var mth = "";
	var day = "";
	var ret = "";
	if (pMonth > 9)
		mth = pMonth.toString();
	else
		mth = "0"+pMonth.toString();

	if (pDay > 9)
		day = pDay.toString();
	else
		day = "0"+pDay.toString();

	if (pFormat=="YYYY-MM-DD")
		ret = pYear.toString()+"-"+mth+"-"+day;
	else
		ret = ""+mth+"/"+day+"/"+pYear.toString();

	return ret;
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
	// 4/30/08 - DQ - Corrected Error where option parameter was ignored
	var itemCap = capId;
	if (arguments.length == 2) itemCap = arguments[1]; // use cap ID specified in args

	capResult = aa.cap.getCap(itemCap)

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
		else
		{ logDebug( "**ERROR: getting app specific info for Cap : " + appSpecInfoResult.getErrorMessage()) }
	}


function editChannelReported(channel) // option CapId
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

	cd.setReportedChannel(channel);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("Updated channel reported to " + channel) }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}

function editContactType(existingType,newType)
//Function will change contact types from exsistingType to newType,
//optional paramter capID
{
	var updateCap = capId
	if (arguments.length==3)
		updateCap=arguments[2]

	capContactResult = aa.people.getCapContactByCapID(updateCap);
	if (capContactResult.getSuccess())
		{
		Contacts = capContactResult.getOutput();
		for (yy in Contacts)
			{
			var theContact = Contacts[yy].getCapContactModel();
			if(theContact.getContactType() == existingType)
				{
				theContact.setContactType(newType);
				aa.people.editCapContact(theContact);
				logDebug("Contact for " + theContact.getFullName() + " Updated to " + newType);
				}
			}
		}
}
function editHouseCount(numHouse) // option CapId
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

	cd.setHouseCount(parseFloat(numHouse));

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("Updated house count to " + numHouse); return true; }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
	}

function editLookup(stdChoice,stdValue,stdDesc)
	{
	//check if stdChoice and stdValue already exist; if they do, update;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	if (bizDomScriptResult.getSuccess())
		{
		bds = bizDomScriptResult.getOutput();
		}
	else
		{
		logDebug("Std Choice(" + stdChoice + "," + stdValue + ") does not exist to edit, adding...");
		addLookup(stdChoice,stdValue,stdDesc);
		return false;
		}
	var bd = bds.getBizDomain()

	bd.setDescription(stdDesc);
	var editResult = aa.bizDomain.editBizDomain(bd)

	if (editResult.getSuccess())
		logDebug("Successfully edited Std Choice(" + stdChoice + "," + stdValue + ") = " + stdDesc);
	else
		logDebug("**ERROR editing Std Choice " + editResult.getErrorMessage());
	}


function editPriority(priority) // option CapId
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

	cd.setPriority(priority);

	cdWrite = aa.cap.editCapDetail(cd)

	if (cdWrite.getSuccess())
		{ logDebug("updated priority to " + priority) ; return true; }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
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
	}
function editReportedChannel(reportedChannel) // option CapId
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

	cd.setReportedChannel(reportedChannel);

	cdWrite = aa.cap.editCapDetail(cd);

	if (cdWrite.getSuccess())
		{ logDebug("updated reported channel to " + reportedChannel) ; return true; }
	else
		{ logDebug("**ERROR writing capdetail : " + cdWrite.getErrorMessage()) ; return false ; }
}
function editTaskComment(wfstr,wfcomment) // optional process name
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
	 			logDebug("**ERROR: Failed to get Task Specific Info objects: " + TSIResult.getErrorMessage());
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


function feeAmount(feestr)
	{
    // optional statuses to check for (SR5082)
    //
    var checkStatus = false;
	var statusArray = new Array();

	//get optional arguments
	if (arguments.length > 1)
		{
		checkStatus = true;
		for (var i=1; i<arguments.length; i++)
			statusArray.push(arguments[i]);
		}

	var feeTotal = 0;
	var feeResult=aa.fee.getFeeItems(capId);
	if (feeResult.getSuccess())
		{ var feeObjArr = feeResult.getOutput(); }
	else
		{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

	for (ff in feeObjArr)
		if ( feestr.equals(feeObjArr[ff].getFeeCod()) && (!checkStatus || exists(feeObjArr[ff].getFeeitemStatus(),statusArray)) )
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
			aArray["FEIN"] = capContactArray[yy].getPeople().getFein();
			aArray["email"] = capContactArray[yy].getPeople().email;
			aArray["addressLine1"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine1();
			aArray["addressLine2"] = capContactArray[yy].getPeople().getCompactAddress().getAddressLine2();
			aArray["city"] = capContactArray[yy].getPeople().getCompactAddress().getCity();
			aArray["state"] = capContactArray[yy].getPeople().getCompactAddress().getState();
			aArray["zip"] = capContactArray[yy].getPeople().getCompactAddress().getZip();
			aArray["fax"] = capContactArray[yy].getPeople().fax;
			aArray["notes"] = capContactArray[yy].getPeople().notes;
			aArray["country"] = capContactArray[yy].getPeople().getCompactAddress().getCountry();
			aArray["fullName"] = capContactArray[yy].getCapContactModel().getPeople().getFullName();
	        aArray["middleName"] = capContactArray[yy].getPeople().middleName;
			aArray["gender"] = capContactArray[yy].getPeople().gender;
			aArray["businessName2"] = capContactArray[yy].getPeople().getTradeName();
    		aArray["salutation"] = capContactArray[yy].getPeople().getSalutation();


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

	  	if (n.equals(suo.deptOfUser) && m.getDeptName() != null)
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
		{ //aa.print("**ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; 
		return false; }

	var gisObjResult = aa.gis.getCapGISObjects(capId); // get gis objects on the cap
	if (gisObjResult.getSuccess())
		var fGisObj = gisObjResult.getOutput();
	else
		{ //aa.print("**ERROR: Getting GIS objects for Cap.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; 
		return false; }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ //aa.print("**ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; 
			return false; }

		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
			for (z1 in proxObj)
				{
				var n = proxObj[z1].getAttributeNames();
				var v = proxObj[z1].getAttributeValues();

				var valArray = new Array();

				//
				// 09/18/08 JHS Explicitly adding the key field of the object, since getBufferByRadius will not pull down the key field
				// hardcoded this to GIS_ID
				//

				valArray["GIS_ID"] = proxObj[z1].getGisId()
				for (n1 in n)
					{
					valArray[n[n1]] = v[n1];
					}
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


function getGISInfoArray(svc,layer,attributename)
	{
	// use buffer info to get info on the current object by using distance 0
	// usage:
	//
	// x = getGISInfo("flagstaff","Parcels","LOT_AREA");
	//

	var distanceType = "feet";
	var retArray = new Array();

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
				var v = proxObj[z1].getAttributeValues();
				retArray.push(v[0]);
				}

			}
		}
	return retArray;
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
	 var startTag = "<"+fName+">";
	 var endTag = "</"+fName+">";

	 startPos = fString.indexOf(startTag) + startTag.length;
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


function getParents(pAppType)
	{
		// returns the capId array of all parent caps
	    //Dependency: appMatch function
		//

		var i = 1;
        while (true)
        {
			if (!(aa.cap.getProjectParents(capId,i).getSuccess()))
				break;

			i += 1;
        }
        i -= 1;

		getCapResult = aa.cap.getProjectParents(capId,i);
        myArray = new Array();

		if (getCapResult.getSuccess())
		{
			parentArray = getCapResult.getOutput();

			if (parentArray.length)
			{
				for(x in parentArray)
				{
					if (pAppType != null)
					{
						//If parent type matches apType pattern passed in, add to return array
						if ( appMatch( pAppType, parentArray[x].getCapID() ) )
							myArray.push(parentArray[x].getCapID());
					}
					else
						myArray.push(parentArray[x].getCapID());
				}

				return myArray;
			}
			else
			{
				logDebug( "**WARNING: GetParent found no project parent for this application");
				return null;
			}
		}
		else
		{
			logDebug( "**WARNING: getting project parents:  " + getCapResult.getErrorMessage());
			return null;
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
			if (refstlic && refstlic.toUpperCase().equals(newLicArray[thisLic].getStateLicense().toUpperCase()))
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


function getReportedChannel() // option CapId
{
	var itemCap = capId
	if (arguments.length > 0)
		itemCap = arguments[0]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	cd = cdScriptObj.getCapDetailModel();

	var sReturn = cd.getReportedChannel();

	if(sReturn != null)
		return sReturn;
	else
		return "";
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


function getShortNotes() // option CapId
{
	var itemCap = capId
	if (arguments.length > 0)
		itemCap = arguments[0]; // use cap ID specified in args

	var cdScriptObjResult = aa.cap.getCapDetail(itemCap);
	if (!cdScriptObjResult.getSuccess())
		{ logDebug("**ERROR: No cap detail script object : " + cdScriptObjResult.getErrorMessage()) ; return false; }

	var cdScriptObj = cdScriptObjResult.getOutput();

	if (!cdScriptObj)
		{ logDebug("**ERROR: No cap detail script object") ; return false; }

	cd = cdScriptObj.getCapDetailModel();

	var sReturn = cd.getShortNotes();

	if(sReturn != null)
		return sReturn;
	else
		return "";
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



function xmlEscapeXMLToHTML(xmlData) {
    /*************************************************************************************
    Function:       xmlEscapeXMLToHTML

    author:         xwisdom@yahoo.com

    description:
        Encodes XML data for use in a web page

    ************************************************************************************/
    var gt;

    var str = xmlData;

    //replace & with &
    gt = -1;
    while (str.indexOf("&", gt + 1) > -1) {
        var gt = str.indexOf("&", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += "&";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    //replace < with <
    gt = -1;
    while (str.indexOf("<", gt + 1) > -1) {
        var gt = str.indexOf("<", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += "<";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    //replace > with >
    gt = -1;
    while (str.indexOf(">", gt + 1) > -1) {
        var gt = str.indexOf(">", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += ">";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    //replace \n with <br>
    gt = -1;
    while (str.indexOf("\n", gt + 1) > -1) {
        var gt = str.indexOf("\n", gt + 1);
        var newStr = str.substr(0, gt);
        newStr += "<br>";
        newStr = newStr + str.substr(gt + 1, str.length);
        str = newStr;
    }

    return str

}  // end function xmlEscapeXMLToHTML


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


function invoiceFee(fcode,fperiod)
    {
    //invoices all assessed fees having fcode and fperiod
    // SR5085 LL
    var feeFound=false;
    getFeeResult = aa.finance.getFeeItemByFeeCode(capId,fcode,fperiod);
    if (getFeeResult.getSuccess())
        {
        var feeList = getFeeResult.getOutput();
        for (feeNum in feeList)
			if (feeList[feeNum].getFeeitemStatus().equals("NEW"))
				{
				var feeSeq = feeList[feeNum].getFeeSeqNbr();
				feeSeqList.push(feeSeq);
				paymentPeriodList.push(fperiod);
                feeFound=true;
                logDebug("Assessed fee "+fcode+" found and tagged for invoicing");
                }
        }
    else
		{ logDebug( "**ERROR: getting fee items (" + fcode + "): " + getFeeResult.getErrorMessage())}
    return feeFound;
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



function jsDateToASIDate(dateValue)
{
  //Converts Javascript Date to ASI 0 pad MM/DD/YYYY
  //
  if (dateValue != null)
  {
	if (Date.prototype.isPrototypeOf(dateValue))
	{
	    var M = "" + (dateValue.getMonth()+1);
	    var MM = "0" + M;
	    MM = MM.substring(MM.length-2, MM.length);
	    var D = "" + (dateValue.getDate());
	    var DD = "0" + D;
	    DD = DD.substring(DD.length-2, DD.length);
	    var YYYY = "" + (dateValue.getFullYear());
	    return MM + "/" + DD + "/" + YYYY;
	}
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
  				  	{ logMessage("**ERROR: Failed to get cap ID: " + ltcapidstr + " error: " +  ltresult.getErrorMessage()); return false; }
                }
		else
			itemCap = ltcapidstr;
		}

  	var feeArr = new Array();

	var feeResult=aa.fee.getFeeItems(itemCap);
		if (feeResult.getSuccess())
			{ var feeObjArr = feeResult.getOutput(); }
		else
			{ logDebug( "**ERROR: getting fee items: " + capContResult.getErrorMessage()); return false }

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
			myFee.description = fFee.getFeeDescription();
                        myFee.sched = fFee.getF4FeeItemModel().getFeeSchudle();
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


function removeASITable(tableName) // optional capId
  	{
	//  tableName is the name of the ASI table
	//  tableValues is an associative array of values.  All elements MUST be strings.
  	var itemCap = capId
	if (arguments.length > 1)
		itemCap = arguments[1]; // use cap ID specified in args

	var tssmResult = aa.appSpecificTableScript.removeAppSpecificTableInfos(tableName,itemCap,currentUserID)

	if (!tssmResult.getSuccess())
		{ //aa.print("**WARNING: error removing ASI table " + tableName + " " + tssmResult.getErrorMessage()); 
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




function replaceNode(fString,fName,fContents)
	{
	 var fValue = "";
	var startTag = "<"+fName+">";
	 var endTag = "</"+fName+">";

		 startPos = fString.indexOf(startTag) + startTag.length;
		 endPos = fString.indexOf(endTag);
		 // make sure startPos and endPos are valid before using them
		 if (startPos > 0 && startPos <= endPos)
		 		{
				  fValue = fString.substring(0,startPos) + fContents + fString.substring(endPos);
 					return unescape(fValue);
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
	var inspComm = "Scheduled via Script";
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
	// DQ - Added Optional 4th parameter inspTime Valid format is HH12:MIAM or AM (SR5110)
	// DQ - Added Optional 5th parameter inspComm ex. to call without specifying other options params scheduleInspection("Type",5,null,null,"Schedule Comment");
	var inspectorObj = null;
	var inspTime = null;
	var inspComm = "Scheduled via Script";
	if (arguments.length >= 3)
		if (arguments[2] != null)
		{
		var inspRes = aa.person.getUser(arguments[2])
		if (inspRes.getSuccess())
			var inspectorObj = inspRes.getOutput();
		}

	if (arguments.length >= 4)
	    if (arguments[3] != null)
		    inspTime = arguments[3];

	if (arguments.length == 5)
	    if (arguments[4] != null)
	        inspComm = arguments[4];

	var schedRes = aa.inspection.scheduleInspection(capId, inspectorObj, aa.date.parseDate(dateAdd(null,DaysAhead)), inspTime, iType, inspComm)

	if (schedRes.getSuccess())
		logDebug("Successfully scheduled inspection : " + iType + " for " + dateAdd(null,DaysAhead));
	else
		logDebug( "**ERROR: adding scheduling inspection (" + iType + "): " + schedRes.getErrorMessage());
	}



function searchProject(pProjType,pSearchType)
{
	// Searches Related Caps
	// pProjType = Application type marking highest point to search.  Ex. Building/Project/NA/NA
	// pSearchType = Application type to search for. Ex. Building/Permit/NA/NA
	// Returns CapID array of all unique matching SearchTypes

    var i = 1;
	var typeArray;
	var duplicate = false;
	var childArray = new Array();
	var tempArray = new Array();
	var temp2Array = new Array();
	var searchArray = new Array();
	var childrenFound = false;
	var isMatch;
        while (true)
        {
	 if (!(aa.cap.getProjectParents(capId,i).getSuccess()))
             break;
         i += 1;
        }
        i -= 1;

	getCapResult = aa.cap.getProjectParents(capId,i);
        myArray = new Array();
	myOutArray = new Array();

	if(pProjType != null)
	{
		var typeArray = pProjType.split("/");
		if (typeArray.length != 4)
			logDebug("**ERROR in childGetByCapType function parameter.  The following cap type parameter is incorrectly formatted: " + pCapType);
	}

	if (getCapResult.getSuccess())
	{
		parentArray = getCapResult.getOutput();
		if (parentArray.length)
		{
			for(x in parentArray)
				childTypeArray = parentArray[x].getCapType().toString().split("/");
				isMatch = true;
				for (yy in childTypeArray) //looking for matching cap type
				{
				if (!typeArray[yy].equals(childTypeArray[yy]) && !typeArray[yy].equals("*"))
					{
						isMatch = false;
						break;
					}
				}
				if(isMatch)
					myArray.push(parentArray[x].getCapID());
		}
	}

	if (!myArray.length)
		return childArray;

	searchArray = myArray;
	var temp = ""


	if(pSearchType != null)
	{
		typeArray = pSearchType.split("/");
		if (typeArray.length != 4)
			logDebug("**ERROR in childGetByCapType function parameter.  The following cap type parameter is incorrectly formatted: " + pSearchType);
	}


	while (true)
		{
			for(x in searchArray)
				{
					tempArray = getChildren("*/*/*/*",searchArray[x]);
					if (tempArray == null)
						continue;
					for(y in tempArray)
						{
							duplicate = false;
							for(z in childArray)
							{
								if ( childArray[z].getCustomID().equals(tempArray[y].getCustomID()) )
									{duplicate = true; break;}
							}
							if (!duplicate)
							{
								temp2Array.push(tempArray[y]);
								if(!capId.getCustomID().equals(tempArray[y].getCustomID()))
								{
									var chkTypeArray = aa.cap.getCap(tempArray[y]).getOutput().getCapType().toString().split("/");
									isMatch = true;
									for (p in chkTypeArray) //looking for matching cap type
									{
										if (typeArray[p] != chkTypeArray[p] && typeArray[p] != "*")
										{
											isMatch = false;
											break;
										}
									}
									if(isMatch)
										{childArray.push(tempArray[y]);}
								}
							}
						}

				}

			if(temp2Array.length)
				searchArray = temp2Array;
			else
				break;
			temp2Array = new Array();
		}
	return childArray;
}


function setIVR(ivrnum)
	{
	capModel = cap.getCapModel();
	capIDModel = capModel.getCapID();
	
	capModel.setCapID(capIDModel);

	aa.cap.editCapByPK(capModel);

	// new a CapScriptModel
	var scriptModel = aa.cap.newCapScriptModel().getOutput();

	// get a new CapModel
	var capModel = scriptModel.getCapModel();
	var capIDModel = capModel.getCapID();

	capIDModel.setServiceProviderCode(scriptModel.getServiceProviderCode());
	capIDModel.setID1(aa.env.getValue("PermitId1"));
	capIDModel.setID2(aa.env.getValue("PermitId2"));
	capIDModel.setID3(aa.env.getValue("PermitId3"));

	capModel.setTrackingNbr(ivrnum);
	capModel.setCapID(capIDModel);

	// update tracking number
	aa.cap.editCapByPK(capModel);
	comment("IVR Tracking Number updated to " + ivrnum);
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


function taskStatusDate(wfstr) // optional process name, capId
	{

    var itemCap = capId;
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
			return ""+(fTask.getStatusDate().getMonth()+1)+"/"+fTask.getStatusDate().getDate()+"/"+(parseInt(fTask.getStatusDate().getYear())+1900);
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


	
function updateWorkDesc(newWorkDes) // optional CapId
{
    var itemCap = capId
    if (arguments.length > 1) 
        itemCap = arguments[1]; // use cap ID specified in args
    var workDescResult = aa.cap.getCapWorkDesByPK(itemCap);
    var workDesObj;
    
    if (!workDescResult.getSuccess()) {
		// Add work description --start
		if (newWorkDes != null && newWorkDes != ""){
			var newWorkDesModel = aa.cap.getCapWorkDesModel().getOutput();
			newWorkDesModel.setCapID(capId);
			newWorkDesModel.setDescription(newWorkDes);
			newWorkDesModel.setAuditDate(aa.util.now());
			newWorkDesModel.setAuditID(currentUserID);
			newWorkDesModel.setAuditStatus("A");
			aa.cap.createCapWorkDes(newWorkDesModel);
			aa.print("Create Work Description : " + newWorkDes);
			return "";
		}
		else{
			aa.print("**ERROR: Failed to get work description: " + workDescResult.getErrorMessage());
			return false;
		}
		// Add work description --End
    }
    
    var workDesScriptObj = workDescResult.getOutput();
    if (workDesScriptObj) 
        workDesObj = workDesScriptObj.getCapWorkDesModel()
    else {
        aa.print("**ERROR: Failed to get workdes Obj: " + workDescResult.getErrorMessage());
        return false;
    }
    
    
    workDesObj.setDescription(newWorkDes);
    aa.cap.editCapWorkDes(workDesObj);
   
    aa.print("Updated Work Description to : " + newWorkDes);
    
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

function zeroPad(num,count)
{
var numZeropad = num + '';
while(numZeropad.length < count) {

numZeropad = "0" + numZeropad;
}
return numZeropad;
}

function validateConditions(pType,pStatus)
	{
	var condResult = aa.capCondition.getCapConditions(capId);

	if (condResult.getSuccess())
		var capConds = condResult.getOutput();
	else
		{
		logDebug("**ERROR: getting cap conditions: " + condResult.getErrorMessage());
		return false;
		}

	for (cc in capConds)
		{
		var thisCond = capConds[cc];
		var cType = thisCond.getConditionType();
		var cStatus = thisCond.getConditionStatus();

		if (cType.indexOf(pType) < 0) continue; // not matching type

		if (!cStatus.toUpperCase().equals(pStatus.toUpperCase()))
			return false;
		}
	return true;
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
			aArray["fein"] = peopleModel.getFein();
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

function getCapTypeByAltID(altID)
{
	myCap = aa.cap.getCapID(altID).getOutput()
	capType = aa.cap.getCap(myCap).getOutput().getCapType()

	return capType;


}

function getLicenseCapId(licenseCapType) {
    var itemCap = capId
    if (arguments.length > 1) itemCap = arguments[1]; // use cap ID specified in args

    var capLicenses = getLicenseProfessional(itemCap);
    if (capLicenses == null || capLicenses.length == 0) {
        return;
    }

    for (var capLic in capLicenses) {
        var LPNumber = capLicenses[capLic].getLicenseNbr()
        var lpCapResult = aa.cap.getCapID(LPNumber);
        if (!lpCapResult.getSuccess())
        { logDebug("**ERROR: No cap ID associated with License Number : " + LPNumber); continue; }
        var licCapId = lpCapResult.getOutput();
        if (appMatch(licenseCapType, licCapId))
            return licCapId;
    }
}



function getLicenseProfessional(itemcapId) {
    capLicenseArr = null;
    var s_result = aa.licenseProfessional.getLicenseProf(itemcapId);
    if (s_result.getSuccess()) {
        capLicenseArr = s_result.getOutput();
        if (capLicenseArr == null || capLicenseArr.length == 0) {
            //aa.print("WARNING: no licensed professionals on this CAP:" + itemcapId);
            capLicenseArr = null;
        }
    }
    else {
        //aa.print("ERROR: Failed to license professional: " + s_result.getErrorMessage());
        capLicenseArr = null;
    }
    return capLicenseArr;
}

function Left(str, n){
	if (n <= 0)
	    return "";
	else if (n > String(str).length)
	    return str;
	else
	    return String(str).substring(0,n);
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

		//Fix for issue SUP-2012-00271 where inactive records return null
		if (!aa.cap.getCap(paymentCapId).getOutput()) continue;
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

        //if (pm.getUdf1() != null) continue;  // already been reconciled and transmitted

        personModel = aa.person.getUser(pm.getCashierID()).getOutput();
        
        if (!personModel) continue; // online

        var branchCode = pm.getUdf2();
        
        if (branchString != null && !branchString.equals(branchCode)) continue; // filter by branch

        if (groupString != null && !groupString.equals(personModel.getDivisionCode())) continue; // filter by cashier group

        if (trxType != null && !trxType.equals(aa.cap.getCap(paymentCapId).getOutput().getCapType().toString())) continue; //filter by transaction type


	if (RTRX[pm.getCashierID()]) RTRX[pm.getCashierID()] = RTRX[pm.getCashierID()] + 1; else RTRX[pm.getCashierID()] = 1;
	if (RAMT[pm.getCashierID()]) RAMT[pm.getCashierID()] = RAMT[pm.getCashierID()] + pm.getPaymentAmount(); else RAMT[pm.getCashierID()] = pm.getPaymentAmount();
	if (RACT[pm.getCashierID()]) 
	{
	
		if (aa.cap.getCap(paymentCapId).getOutput().getCapStatus() != "Cancelled"){
		RACT[pm.getCashierID()] = RACT[pm.getCashierID()] + pm.getPaymentAmount(); 
		}

	}
	else
	{
		RACT[pm.getCashierID()] = "0";
		if (aa.cap.getCap(paymentCapId).getOutput().getCapStatus() != "Cancelled"){
		RACT[pm.getCashierID()] = pm.getPaymentAmount();
		}

	}

	}


	for (pmUser in RTRX)
		{
		var defaultLocked = "No";
		
		if (existingTable)
			for (var tRow in existingTable)
			    {
				logDebug("comparing " + existingTable[tRow]["Cashier ID"].fieldValue + " to " + pmUser);
				if (existingTable[tRow]["Cashier ID"].fieldValue == pmUser)
					{
					defaultLocked = existingTable[tRow]["Lock Payments"].fieldValue;
					}
				}
					
		var RR = new Array();
		RR["Cashier ID"] = new FieldInfo("Cashier ID",pmUser,"Y");
		RR["Cashier Name"] = new FieldInfo("Cashier Name",aa.person.getUser(pmUser).getOutput().getFullName(),"Y");
		//RR["Amount Collected"] = new FieldInfo("Amount Collected", defaultCollected, "N");
		RR["Number of Payments"] = new FieldInfo("Number of Payments", "" + RTRX[pmUser], "Y");
		RR["Actual Amount"] = new FieldInfo("Actual Amount", "" + RACT[pmUser], "Y");
		RR["Amount of Payments"] = new FieldInfo("Amount of Payments", "" + RAMT[pmUser], "Y");
		RR["Lock Payments"] = new FieldInfo("Lock Payments", defaultLocked, "N");
		RR["Comments"] = new FieldInfo("Comment","","N");
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



// Functions added by Larry Cooper on 05-OCT-2010

function getConditions(pType,pStatus,pDesc,pImpact,itemCap) 
	{
	resultArray = new Array();

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
        var mStatus = "Met";
	
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
		
		
		if ( (!mStatus.toUpperCase().equals(cStatus.toUpperCase()) &&  !pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
			{
			var r = new condMatchObj;
			r.objType = "Record";
			r.status = cStatus;
			r.type = cType;
			r.impact = cImpact;
			r.description = cDesc;
			r.comment = cComment;
			
			resultArray.push(r);
			}
		}
		
	
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
			addCondResult = aa.addressCondition.getAddressConditions(addrArray[thisAddr].getRefAddressId());
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

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (!mStatus.toUpperCase().equals(cStatus.toUpperCase()) &&  !pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "Address";
					r.addressObj = addrArray[thisAddr];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					resultArray.push(r);
					}
				}
			}
			
	
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
			parcCondResult = aa.parcelCondition.getParcelConditions(parcArray[thisParc].getParcelNumber());
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

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (!mStatus.toUpperCase().equals(cStatus.toUpperCase()) &&  !pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "Parcel";
					r.parcelObj = parcArray[thisParc];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					resultArray.push(r);
					}
				}
			}


	
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

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (!mStatus.toUpperCase().equals(cStatus.toUpperCase()) &&  !pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "License";
					r.licenseObj = licArray[thisLic];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					resultArray.push(r);
					}
				}
			}

	
	
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

				if ( (pType==null || pType.toUpperCase().equals(cType.toUpperCase())) && (!mStatus.toUpperCase().equals(cStatus.toUpperCase()) && !pStatus.toUpperCase().equals(cStatus.toUpperCase())) && (pDesc==null || pDesc.toUpperCase().equals(cDesc.toUpperCase())) && (pImpact==null || pImpact.toUpperCase().equals(cImpact.toUpperCase())))
					{
					var r = new condMatchObj;
					r.objType = "Contact";
					r.contactObj = conArray[thisCon];
					r.status = cStatus;
					r.type = cType;
					r.impact = cImpact;
					r.description = cDesc;
					r.comment = cComment;

					resultArray.push(r);
					}
				}
			}


		return resultArray;
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
	
        signAmend = getAppSpecific("Signboard Amendment", capId);
	capitalCA = getAppSpecific("Capital", capId);
	capitalCN = getAppSpecific("Capital", parentCapId);
	widthCA = getAppSpecific("Width", capId);
	lengthCA = getAppSpecific("Length", capId);
	widthCN = getAppSpecific("Width", parentCapId);
	lengthCN = getAppSpecific("Length", parentCapId);
	originCA = getAppSpecific("Country of origin", capId);
	originCN = getAppSpecific("Country of origin", parentCapId);
	licenseCA = getAppSpecific("License Type", capId);
	licenseCN = getAppSpecific("License Type", parentCapId);
	legalFormCA = getAppSpecific("Legal Form", capId);
	legalFormCN = getAppSpecific("Legal Form", parentCapId);
	lightingCN = getAppSpecific("Lighting Type", parentCapId);
	lightingCA = getAppSpecific("Lighting Type" , capId);
	boardcolorCA = getAppSpecific("Board Color", capId);
	boardcolorCN = getAppSpecific("Board Color", parentCapId);
	
	if(capitalCA && !capitalCA.equals(capitalCN))
	{
		result+=aa.messageResources.getLocalMessage("message.amend.capital")+" "+ capitalCN +" " +aa.messageResources.getLocalMessage("message.keywords.to") +" "+ capitalCA + " " + "\n";
	}
	
	if (signAmend.substr(0,1) == "Y")
	{
		result += aa.messageResources.getLocalMessage("message.amend.signboardtotal")+" " + " " + widthCN + "x" + lengthCN + " " + aa.messageResources.getLocalMessage("message.keywords.to") + " " + widthCA + "x" + lengthCA + "\n";
	}
	
	if (boardcolorCA && !boardcolorCA.equals(boardcolorCN))
	{
		result += aa.messageResources.getLocalMessage("message.amend.signboardcolor")+" "+ boardcolorCN  +" "+aa.messageResources.getLocalMessage("message.keywords.to") +" "+ boardcolorCA + "\n";
	}
	
	if (lightingCA && !lightingCA.equals(lightingCN))
	{
		aa.messageResources.getLocalMessage("message.amend.signboardlighting")+" "+ lightingCN +" " + aa.messageResources.getLocalMessage("message.keywords.to") +" "+ lightingCA + "\n";
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