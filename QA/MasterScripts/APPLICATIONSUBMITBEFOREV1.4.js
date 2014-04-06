/*------------------------------------------------------------------------------------------------------/
| Program : ApplicationSubmitBeforeV1.4.js  
| Event   : ApplicationSubmitBefore
|
| Usage   : Master Script by Accela.  See accompanying documentation and release notes.
|
| Client  : N/A  
| Action# : N/A
| 
| Notes   :
|


fcgfgcvcvcvcv
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var aslogDir = "C:\\Accela72\\av.biz\\log\\" + aa.env.getValue("CurrentUserID") + "\\" + aa.date.getCurrentDate().getDayOfMonth() + "-" + aa.date.getCurrentDate().getMonth() + "-" + aa.date.getCurrentDate().getYear() + ".html";
var showMessage = false;			// Set to true to see results in popup window
var showDebug = true;				// Set to true to see debug messages in popup window
var controlString = "ApplicationSubmitBefore"; 	// Standard choice for control
var preExecute = "PreExecuteForBeforeEvents"
var cancel = false ; 				// Setting cancel to true in standard choices will cancel the event
var documentOnly = false;			// Document Only -- displays hierarchy of std choice steps
var disableTokens = false;			// turn off tokenizing of App Specific and Parcel Attributes
var useAppSpecificGroupName = false;		// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;		// Use Group name when populating Task Specific Info Values
var maxEntries = 99;				// Maximum number of std choice entries.  Must be Left Zero Padded
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";					// Message String
var debug = "";
var br = "<BR>";					// Break Tag

if (documentOnly) { 
	doStandardChoiceActions(controlString,false,0); 
	aa.env.setValue("ScriptReturnCode", "0"); 
	aa.env.setValue("ScriptReturnMessage", "Documentation Successful.  No actions executed.");
	aa.abortScript(); 
	}

logDebug("<B>EMSE Script Results</B>");

/*------------------------------------------------------------------------------------------------------/
| BEGIN Event Specific Variables
/------------------------------------------------------------------------------------------------------*/

var AdditionalInfoBuildingCount 	= aa.env.getValue("AdditionalInfoBuildingCount");
var AdditionalInfoConstructionTypeCode 	= aa.env.getValue("AdditionalInfoConstructionTypeCode");
var AdditionalInfoHouseCount 		= aa.env.getValue("AdditionalInfoHouseCount");
var AdditionalInfoPublicOwnedFlag 	= aa.env.getValue("AdditionalInfoPublicOwnedFlag");
var AdditionalInfoValuation 		= aa.env.getValue("AdditionalInfoValuation");
var AdditionalInfoWorkDescription 	= aa.env.getValue("AdditionalInfoWorkDescription");
var AddressCity 			= aa.env.getValue("AddressCity");
var AddressHouseFraction 		= aa.env.getValue("AddressHouseFraction");
var AddressHouseNumber 			= aa.env.getValue("AddressHouseNumber");
var AddressPrimaryFlag 			= aa.env.getValue("AddressPrimaryFlag");
var AddressState 			= aa.env.getValue("AddressState");
var AddressStreetDirection 		= aa.env.getValue("AddressStreetDirection");
var AddressStreetName 			= aa.env.getValue("AddressStreetName");
var AddressStreetSuffix 		= aa.env.getValue("AddressStreetSuffix");
var AddressUnitNumber 			= aa.env.getValue("AddressUnitNumber");
var AddressUnitType 			= aa.env.getValue("AddressUnitType");
var AddressValidatedNumber 		= aa.env.getValue("AddressValidatedNumber");
var AddressZip 				= aa.env.getValue("AddressZip");
var AppSpecificInfoModels 		= aa.env.getValue("AppSpecificInfoModels");
var ApplicantAddressLine1 		= aa.env.getValue("ApplicantAddressLine1");
var ApplicantAddressLine2 		= aa.env.getValue("ApplicantAddressLine2");
var ApplicantAddressLine3 		= aa.env.getValue("ApplicantAddressLine3");
var ApplicantBusinessName 		= aa.env.getValue("ApplicantBusinessName");
var ApplicantCity 			= aa.env.getValue("ApplicantCity");
var ApplicantContactType 		= aa.env.getValue("ApplicantContactType");
var ApplicantCountry 			= aa.env.getValue("ApplicantCountry");
var ApplicantEmail 			= aa.env.getValue("ApplicantEmail");
var ApplicantFirstName 			= aa.env.getValue("ApplicantFirstName");
var ApplicantId 			= aa.env.getValue("ApplicantId");
var ApplicantLastName 			= aa.env.getValue("ApplicantLastName");
var ApplicantMiddleName 		= aa.env.getValue("ApplicantMiddleName");
var ApplicantPhone1 			= aa.env.getValue("ApplicantPhone1");
var ApplicantPhone2 			= aa.env.getValue("ApplicantPhone2");
var ApplicantRelation 			= aa.env.getValue("ApplicantRelation");
var ApplicantState 			= aa.env.getValue("ApplicantState");
var ApplicantZip 			= aa.env.getValue("ApplicantZip");
var ApplicationSubmitMode 		= aa.env.getValue("ApplicationSubmitMode");
var ApplicationTypeLevel1 		= aa.env.getValue("ApplicationTypeLevel1");
var ApplicationTypeLevel2 		= aa.env.getValue("ApplicationTypeLevel2");
var ApplicationTypeLevel3 		= aa.env.getValue("ApplicationTypeLevel3");
var ApplicationTypeLevel4 		= aa.env.getValue("ApplicationTypeLevel4");
var CAEAddressLine1 			= aa.env.getValue("CAEAddressLine1");
var CAEAddressLine2 			= aa.env.getValue("CAEAddressLine2");
var CAEAddressLine3 			= aa.env.getValue("CAEAddressLine3");
var CAEBusinessName 			= aa.env.getValue("CAEBusinessName");
var CAECity 				= aa.env.getValue("CAECity");
var CAEEmail 				= aa.env.getValue("CAEEmail");
var CAEFirstName 			= aa.env.getValue("CAEFirstName");
var CAELastName 			= aa.env.getValue("CAELastName");
var CAELienseNumber 			= aa.env.getValue("CAELienseNumber");
var CAELienseType 			= aa.env.getValue("CAELienseType");
var CAEMiddleName 			= aa.env.getValue("CAEMiddleName");
var CAEPhone1 				= aa.env.getValue("CAEPhone1");
var CAEPhone2 				= aa.env.getValue("CAEPhone2");
var CAEState 				= aa.env.getValue("CAEState");
var CAEValidatedNumber 			= aa.env.getValue("CAEValidatedNumber");
var CAEZip 				= aa.env.getValue("CAEZip");
var ComplainantAddressLine1 		= aa.env.getValue("ComplainantAddressLine1");
var ComplainantAddressLine2 		= aa.env.getValue("ComplainantAddressLine2");
var ComplainantAddressLine3 		= aa.env.getValue("ComplainantAddressLine3");
var ComplainantBusinessName 		= aa.env.getValue("ComplainantBusinessName");
var ComplainantCity 			= aa.env.getValue("ComplainantCity");
var ComplainantContactType 		= aa.env.getValue("ComplainantContactType");
var ComplainantCountry 			= aa.env.getValue("ComplainantCountry");
var ComplainantEmail 			= aa.env.getValue("ComplainantEmail");
var ComplainantFax 			= aa.env.getValue("ComplainantFax");
var ComplainantFirstName 		= aa.env.getValue("ComplainantFirstName");
var ComplainantId 			= aa.env.getValue("ComplainantId");
var ComplainantLastName 		= aa.env.getValue("ComplainantLastName");
var ComplainantMiddleName 		= aa.env.getValue("ComplainantMiddleName");
var ComplainantPhone1 			= aa.env.getValue("ComplainantPhone1");
var ComplainantRelation 		= aa.env.getValue("ComplainantRelation");
var ComplainantState 			= aa.env.getValue("ComplainantState");
var ComplainantZip 			= aa.env.getValue("ComplainantZip");
var ComplaintDate 			= aa.env.getValue("ComplaintDate");
var ComplaintReferenceId1 		= aa.env.getValue("ComplaintReferenceId1");
var ComplaintReferenceId2 		= aa.env.getValue("ComplaintReferenceId2");
var ComplaintReferenceId3 		= aa.env.getValue("ComplaintReferenceId3");
var ComplaintReferenceSource 		= aa.env.getValue("ComplaintReferenceSource");
var ComplaintReferenceType 		= aa.env.getValue("ComplaintReferenceType");
var CurrentUserID 			= aa.env.getValue("CurrentUserID");
var OwnerFirstName 			= aa.env.getValue("OwnerFirstName");
var OwnerFullName 			= aa.env.getValue("OwnerFullName");
var OwnerLastName 			= aa.env.getValue("OwnerLastName");
var OwnerMailAddressLine1 		= aa.env.getValue("OwnerMailAddressLine1");
var OwnerMailAddressLine2 		= aa.env.getValue("OwnerMailAddressLine2");
var OwnerMailAddressLine3 		= aa.env.getValue("OwnerMailAddressLine3");
var OwnerMailCity 			= aa.env.getValue("OwnerMailCity");
var OwnerMailState 			= aa.env.getValue("OwnerMailState");
var OwnerMailZip 			= aa.env.getValue("OwnerMailZip");
var OwnerMiddleName 			= aa.env.getValue("OwnerMiddleName");
var OwnerPhone 				= aa.env.getValue("OwnerPhone");
var OwnerPrimaryFlag 			= aa.env.getValue("OwnerPrimaryFlag");
var OwnerValidatedNumber 		= aa.env.getValue("OwnerValidatedNumber");
var ParcelArea 				= aa.env.getValue("ParcelArea");
var ParcelBlock 			= aa.env.getValue("ParcelBlock");
var ParcelBook 				= aa.env.getValue("ParcelBook");
var ParcelExcemptValue 			= aa.env.getValue("ParcelExcemptValue");
var ParcelImprovedValue 		= aa.env.getValue("ParcelImprovedValue");
var ParcelLandValue 			= aa.env.getValue("ParcelLandValue");
var ParcelLegalDescription 		= aa.env.getValue("ParcelLegalDescription");
var ParcelLot 				= aa.env.getValue("ParcelLot");
var ParcelPage 				= aa.env.getValue("ParcelPage");
var ParcelParcel 			= aa.env.getValue("ParcelParcel");
var ParcelTract 			= aa.env.getValue("ParcelTract");
var ParcelValidatedNumber 		= aa.env.getValue("ParcelValidatedNumber");
var ViolationAddressLine1 		= aa.env.getValue("ViolationAddressLine1");
var ViolationAddressLine2 		= aa.env.getValue("ViolationAddressLine2");
var ViolationCity 			= aa.env.getValue("ViolationCity");
var ViolationComment 			= aa.env.getValue("ViolationComment");
var ViolationLocation 			= aa.env.getValue("ViolationLocation");
var ViolationState 			= aa.env.getValue("ViolationState");
var ViolationZip  			= aa.env.getValue("ViolationZip");

/*------------------------------------------------------------------------------------------------------/
| END Event Specific Variables
/------------------------------------------------------------------------------------------------------*/
var appTypeString = ApplicationTypeLevel1 + "/" + ApplicationTypeLevel2 + "/" + ApplicationTypeLevel3 + "/" + ApplicationTypeLevel4;
var appTypeArray = appTypeString.split("/");		// Array of application type string
var currentUserID = aa.env.getValue("CurrentUserID");   // Current USer
var AppSpecificInfoModels = aa.env.getValue("AppSpecificInfoModels");   
var servProvCode = aa.getServiceProviderCode();
var CAENumber = parseInt(CAEValidatedNumber);
var CAE;

var AInfo = new Array()					// Associative array of appspecifc info
loadAppSpecific(AInfo);

// Get CAE Attributes


if (CAENumber > 0)
	{
	var CAEResult = aa.licenseScript.getRefLicenseProfBySeqNbr(servProvCode,CAENumber)
	if (CAEResult.getSuccess())
		{ CAE=CAEResult.getOutput(); }
	else
		{ logDebug("ERROR: getting CAE : " + CAEResult.getErrorMessage()); }
	}
	
if (CAE)
	{
	CAEAtt = CAE.getLicenseModel().getAttributes();
	itr = CAEAtt.values().iterator();
	while(itr.hasNext())
		{
		y = itr.next()
		itr2 = y.iterator();
		while (itr2.hasNext())
			{
			pam = itr2.next();
			AInfo["CAEAttribute." + pam.getAttributeName()] = pam.getAttributeValue();
			}
		} 
	}

var systemUserObj = aa.person.getUser(currentUserID).getOutput();  // Current User Object
var sysDate = aa.date.getCurrentDate();

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
		
/*------------------------------------------------------------------------------------------------------/
| <===========END=Main=Loop================>
/-----------------------------------------------------------------------------------------------------*/

if (debug.indexOf("ERROR") > 0)
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
| Validate License Professional Start (Add by Jovy.Wang 10/31/2008)
| 
/-----------------------------------------------------------------------------------------------------*/
var LicProfList = aa.env.getValue("LicProfList");

var licenseValidateReturnCode = "0";
var licenseValidateReturnMessage = "Follow Licenses are invalid:";

// LicProfList will be not null if the standard choice MULTIPLE_LICENSE_PROFESSIONAL is opened
if (LicProfList != "")
{
	for (var i=0; i<LicProfList.size(); i++)
	{
			var licProfModel = LicProfList.get(i);	
			var licenseType = licProfModel.licenseType;
			var licenseNbr = licProfModel.licenseNbr;
			
			if (!validateLicense(licenseType, licenseNbr))
			{
				licenseValidateReturnCode = "-1";
				licenseValidateReturnMessage += "<br>";
				licenseValidateReturnMessage += " * License type: " + licenseType;
				licenseValidateReturnMessage += " , License number: " + licenseNbr;
			}
	}
}
else // not multiple license professional
{		
	if (!validateLicense(CAELienseType, CAELienseNumber))		
	{
		licenseValidateReturnCode = "-1";	
		licenseValidateReturnMessage += "<br>";
		licenseValidateReturnMessage += " * License type: " + CAELienseType;
		licenseValidateReturnMessage += " , License number: " + CAELienseNumber;
	}
}

// check whether something wrong
if (licenseValidateReturnCode != "0")
{
	aa.env.setValue("ScriptReturnCode", licenseValidateReturnCode);
	aa.env.setValue("ScriptReturnMessage", licenseValidateReturnMessage);	
}

// check whether the licenseType and licenseNbr is valid.
function validateLicense(licenseType, licenseNbr)
{
	var accelawsUrl = 'https://www4.cbs.state.or.us/exs/bcd/accela/ws/accelaws.cfc?method=lic_valid&returnformat=json';
	var client = aa.httpClient;
	
	// set url parameters
	var params = client.initPostParameters();
	params.put('p_lic_type', licenseType);
	params.put('p_lic_num', licenseNbr);
	
	// do validate via web service
	var scripResult = client.post(accelawsUrl, params);	
	
	// check the return value
	if (scripResult.getSuccess())
	{
		var resultString = String(scripResult.getOutput());
		
		//Convert to jsonObject
		var result = eval("("+resultString+")");
		var valid = String(result["VALID"]);

		if (valid.toUpperCase() == "TRUE")
		{
			return true;
		}
	}
	else
	{
		aa.print("ERROR: Failed to validate license: " + scripResult.getErrorMessage());
		return false;
	}		
	
	return false;
}
/*------------------------------------------------------------------------------------------------------/
| Validate License Professional End (Add by Jovy.Wang 10/31/2008)
| 
/-----------------------------------------------------------------------------------------------------*/
	
	
	
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
	
function loadAppSpecific(thisArr) {
	// 
	// Returns an associative array of App Specific Info
	//
	for (loopk in AppSpecificInfoModels)
		{
		if (useAppSpecificGroupName)
			{
			thisArr[AppSpecificInfoModels[loopk].getCheckboxType() + "." + AppSpecificInfoModels[loopk].checkboxDesc] = AppSpecificInfoModels[loopk].checklistComment;
			logDebug("{" + AppSpecificInfoModels[loopk].getCheckboxType() + "." + AppSpecificInfoModels[loopk].checkboxDesc + "} = " + AppSpecificInfoModels[loopk].checklistComment);
			}
			else
			{
			thisArr[AppSpecificInfoModels[loopk].checkboxDesc] = AppSpecificInfoModels[loopk].checklistComment;
			logDebug("{" + AppSpecificInfoModels[loopk].checkboxDesc + "} = " + AppSpecificInfoModels[loopk].checklistComment);
			}
		}
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
      logMessage("ERROR: Failed to get capId: " + s_capResult.getErrorMessage());
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
				if (eval(token(doObj.cri)) || (lastEvalTrue && doObj.continuation))
					{
					eval(token(doObj.act));
					lastEvalTrue = true;
					}
				else
					{
					if (doObj.elseact)
						eval(token(doObj.elseact));
					lastEvalTrue = false;
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
			logMessage("ERROR: The following Criteria/Action pair is incorrectly formatted.  Two or three elements separated by a caret (\"^\") are required. " + br + br + loadStr)
			}
		else
			{
			this.cri     = loadArr[0];
			this.act     = loadArr[1];
			this.elseact = loadArr[2];

			if (this.cri.length() == 0) this.continuation = true; // if format is like ("^action...") then it's a continuation of previous line
			
			var a = loadArr[1];
			var bb = a.indexOf("branch");
			while (bb >= 0)
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
	aa.util.writeToFile(dstr + "<Br>", aslogDir);
	debug+=dstr + br;
	}
	
function logMessage(dstr)
	{
	message+=dstr + br;
	}

	
/*------------------------------------------------------------------------------------------------------/
| <===========External Functions (used by Action entries)
/------------------------------------------------------------------------------------------------------*/

function appMatch(ats) // optional capId string
	{
	var matchArray = appTypeArray //default to current app
	if (arguments.length == 2) 
		{
		matchCapId = aa.cap.getCapID(arguments[1]).getOutput();   // Cap ID to check
		if (!matchCapId)
			{
			logDebug("WARNING: CapId passed to appMatch was not valid: " + arguments[1]);
			return false
			}
		matchCap = aa.cap.getCap(matchCapId).getOutput();
		matchArray = matchCap.getCapType().toString().split("/");
		}
		
	var isMatch = true;
	var ata = ats.split("/");
	if (ata.length != 4)
		logDebug("ERROR in appMatch.  The following Application Type String is incorrectly formatted: " + ats);
	else
		for (xx in ata)
			if (!ata[xx].equals(matchArray[xx]) && !ata[xx].equals("*"))
				isMatch = false;
	return isMatch;
	}	

function branch(stdChoice)
	{
	doStandardChoiceActions(stdChoice,true,0);
	}

function comment(cstr)
	{
	if (showDebug) logDebug(cstr);
	if (showMessage) logMessage(cstr);
	}
	
function lookup(stdChoice,stdValue) 
	{
	var strControl;
	var bizDomScriptResult = aa.bizDomain.getBizDomainByValue(stdChoice,stdValue);
	
   	if (bizDomScriptResult.getSuccess())
   		{
		bizDomScriptObj = bizDomScriptResult.getOutput();
		var strControl = "" + bizDomScriptObj.getDescription(); // had to do this or it bombs.  who knows why?
		logDebug("lookup(" + stdChoice + "," + stdValue + ") = " + strControl);
		}
	else
		{
		logDebug("lookup(" + stdChoice + "," + stdValue + ") does not exist");
		}
	return strControl;
	}

function getRelatedCapsByAddressBefore(ats) 
//
// returns the capId object of the parent.  Assumes only one parent!
//
	{
	var retArr = new Array();
	
	
	if (AddressValidatedNumber > 0) // get the address info from lookup table
	  {
	  addObj = aa.address.getRefAddressByPK(parseInt(AddressValidatedNumber)).getOutput();
	  AddressStreetName = addObj.getStreetName();
	  AddressHouseNumber = addObj.getHouseNumberStart();
	  AddressStreetSuffix = addObj.getStreetSuffix();
	  AddressZip = addObj.getZip();
	  AddressStreetDirection = addObj.getStreetDirection();
	  }

	 if (AddressStreetDirection == "") AddressStreetDirection = null;
	 if (AddressHouseNumber == "") AddressHouseNumber = 0;
	 if (AddressStreetSuffix == "") AddressStreetSuffix = null;
	 if (AddressZip == "") AddressZip = null;
 
 	// get caps with same address
 	capAddResult = aa.cap.getCapListByDetailAddress(AddressStreetName,parseInt(AddressHouseNumber),AddressStreetSuffix,AddressZip,AddressStreetDirection,null);
	if (capAddResult.getSuccess())
		{ var capIdArray=capAddResult.getOutput(); }
	else
		{ logDebug("ERROR: getting similar addresses: " + capAddResult.getErrorMessage());  return false; }


	// loop through related caps
	for (cappy in capIdArray)
		{
		// get file date
		relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();

		// get cap type

		reltype = relcap.getCapType().toString();

		var isMatch = true;
		var ata = ats.split("/");
		if (ata.length != 4)
			logDebug("ERROR: The following Application Type String is incorrectly formatted: " + ats);
		else
			for (xx in ata)
				if (!ata[xx].equals(appTypeArray[xx]) && !ata[xx].equals("*"))
					isMatch = false;

		if (isMatch)			
			retArr.push(capIdArray[cappy]);

		} // loop through related caps

	if (retArr.length > 0)
		return retArr;
		
	}
	
function getRelatedCapsByParcelBefore(ats) 
//
// appsubmitBefore script only.  Returns an array of capids that match the parcelValidatedNumber
// ats, app type string to check for
//
	{
	var retArr = new Array();


	// get caps with same parcel
	var capAddResult = aa.cap.getCapListByParcelID(ParcelValidatedNumber,null);
	if (capAddResult.getSuccess())
		{ var capIdArray=capAddResult.getOutput(); }
	else
		{ logDebug("ERROR: getting similar parcels: " + capAddResult.getErrorMessage());  return false; }

	// loop through related caps
	for (cappy in capIdArray)
		{
		var relcap = aa.cap.getCap(capIdArray[cappy].getCapID()).getOutput();
		// get cap type

		var reltypeArray = relcap.getCapType().toString().split("/");


		var isMatch = true;
		var ata = ats.split("/");
		if (ata.length != 4)
			logDebug("ERROR: The following Application Type String is incorrectly formatted: " + ats);
		else
			for (xx in ata)
				if (!ata[xx].equals(reltypeArray[xx]) && !ata[xx].equals("*"))
					isMatch = false;

		if (isMatch)			
			retArr.push(capIdArray[cappy]);

		} // loop through related caps

	if (retArr.length > 0)
		return retArr;

	}
		
function proximity(svc,layer,numDistance)  // optional: distanceType
	{
	// returns true if the app has a gis object in proximity
	// to be used with ApplicationSubmitBefore only

	var distanceType = "feet"
	if (arguments.length == 4) distanceType = arguments[3]; // use distance type in arg list
   	
	bufferTargetResult = aa.gis.getGISType(svc,layer); // get the buffer target
	if (bufferTargetResult.getSuccess())
		{
		buf = bufferTargetResult.getOutput();
		buf.addAttributeName(layer + "_ID");
		}
	else
		{ logDebug("ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }
	
	
	var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
	if (gisObjResult.getSuccess()) 	
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }

	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }	
		
		for (a2 in proxArr)
			{
			proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
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
		buf = bufferTargetResult.getOutput();
		buf.addAttributeName(attributeName);
		}
	else
		{ logDebug("ERROR: Getting GIS Type for Buffer Target.  Reason is: " + bufferTargetResult.getErrorType() + ":" + bufferTargetResult.getErrorMessage()) ; return false }
			
	var gisObjResult = aa.gis.getParcelGISObjects(ParcelValidatedNumber); // get gis objects on the parcel number
	if (gisObjResult.getSuccess()) 	
		var fGisObj = gisObjResult.getOutput();
	else
		{ logDebug("ERROR: Getting GIS objects for Parcel.  Reason is: " + gisObjResult.getErrorType() + ":" + gisObjResult.getErrorMessage()) ; return false }
	for (a1 in fGisObj) // for each GIS object on the Cap
		{
		var bufchk = aa.gis.getBufferByRadius(fGisObj[a1], numDistance, distanceType, buf);

		if (bufchk.getSuccess())
			var proxArr = bufchk.getOutput();
		else
			{ logDebug("ERROR: Retrieving Buffer Check Results.  Reason is: " + bufchk.getErrorType() + ":" + bufchk.getErrorMessage()) ; return false }	
		
		for (a2 in proxArr)
			{
			var proxObj = proxArr[a2].getGISObjects();  // if there are GIS Objects here, we're done
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
