/*------------------------------------------------------------------------------------------------------/
| Program : INCLUDES_ACCELA_GLOBALS.js
| Event   : N/A
|
| Usage   : Accela Global Includes.  Required for all master scripts.
|
| Notes   : 
|
/------------------------------------------------------------------------------------------------------*/
/*------------------------------------------------------------------------------------------------------/
| START User Configurable Parameters
|
|     Only variables in the following section may be changed.  If any other section is modified, this
|     will no longer be considered a "Master" script and will not be supported in future releases.  If
|     changes are made, please add notes above.
/------------------------------------------------------------------------------------------------------*/
var showMessage = false;		// Set to true to see results in popup window
var showDebug = false;			// Set to true to see debug messages in popup window
var disableTokens = false;		// turn off tokenizing of std choices (enables use of "{} and []")
var useAppSpecificGroupName = false;	// Use Group name when populating App Specific Info Values
var useTaskSpecificGroupName = false;	// Use Group name when populating Task Specific Info Values
var enableVariableBranching = true;	// Allows use of variable names in branching.  Branches are not followed in Doc Only
var maxEntries = 99;			// Maximum number of std choice entries.  Entries must be Left Zero Padded
var mslogDir = "C:\\AccelaLogs\\" + aa.date.getCurrentDate().getDayOfMonth() + "-" + aa.date.getCurrentDate().getMonth() + "-" + aa.date.getCurrentDate().getYear() + "\\" + aa.env.getValue("CurrentUserID") + ".txt";
var initializeLog = true;
/*------------------------------------------------------------------------------------------------------/
| END User Configurable Parameters
/------------------------------------------------------------------------------------------------------*/
var GLOBAL_VERSION = 2.0

var cancel = false;

var vScriptName = aa.env.getValue("ScriptCode");
var vEventName = aa.env.getValue("EventName");

var startDate = new Date();
var startTime = startDate.getTime();
var message =	"";									// Message String
var debug = "";										// Debug String
var br = "<BR>";									// Break Tag
var feeSeqList = new Array();						// invoicing fee list
var paymentPeriodList = new Array();				// invoicing pay periods

var currentUserID = aa.env.getValue("CurrentUserID"); // Current User
var systemUserObj = null;  							// Current User Object
var currentUserGroup = null;						// Current User Group
var publicUserID = null;
var publicUser = false;
var FieldInfo = function(columnName, fieldValue, readOnly) {
	this.columnName = columnName;
	this.fieldValue = fieldValue;
	this.readOnly = readOnly;
};
if (currentUserID.indexOf("PUBLICUSER") == 0){
	publicUserID = currentUserID; 
	currentUserID = "ADMIN"; 
	publicUser = true;
}
if(currentUserID != null){
	systemUserObj = aa.person.getUser(currentUserID).getOutput();  	// Current User Object
}

var sysDate = aa.date.getCurrentDate();
var sysDateMMDDYYYY = dateFormatted(sysDate.getMonth(),sysDate.getDayOfMonth(),sysDate.getYear(),"");

var servProvCode = aa.getServiceProviderCode();

if (currentUserID != null && currentUserID == "JWANG")
{
	showDebug = 3;
}

logDebug("EMSE Script Framework Versions");
logDebug("EVENT TRIGGERED: " + vEventName);
logDebug("SCRIPT EXECUTED: " + vScriptName);
logDebug("INCLUDE VERSION: " + INCLUDE_VERSION);
logDebug("SCRIPT VERSION : " + SCRIPT_VERSION);
logDebug("GLOBAL VERSION : " + GLOBAL_VERSION);


var capId = null;
var cap = null;
var capIDString = "";
var appTypeResult = null;
var appTypeString = "";
var appTypeArray = new Array();
var capName = null;
var capStatus = null;
var fileDateObj = null;
var fileDate = null;
var fileDateYYYYMMDD = null;
var parcelArea = 0;
var estValue = 0;
var calcValue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var balanceDue = 0;
var houseCount = 0;
var feesInvoicedTotal = 0;
var capDetail = "";
var AInfo = new Array();
var partialCap = false;
var feeFactor = "";



capId = null;
if (typeof(getCapId) != "undefined")
	capId = getCapId();
 
if(capId == null){
	if(aa.env.getValue("CapId") != ""){
		sca = String(aa.env.getValue("CapId")).split("-");
		capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
	}else if(aa.env.getValue("CapID") != ""){
		sca = String(aa.env.getValue("CapID")).split("-");
		capId = aa.cap.getCapID(sca[0],sca[1],sca[2]).getOutput();
	}
}
if(capId != null){
	servProvCode = capId.getServiceProviderCode();
	capIDString = capId.getCustomID();
	cap = aa.cap.getCap(capId).getOutput();
	appTypeResult = cap.getCapType();
	appTypeString = appTypeResult.toString();
	appTypeArray = appTypeString.split("/");
	if(appTypeArray[0].substr(0,1) !="_") 
	{
		var currentUserGroupObj = aa.userright.getUserRight(appTypeArray[0],currentUserID).getOutput()
		if (currentUserGroupObj) currentUserGroup = currentUserGroupObj.getGroupName();
	}
	capName = cap.getSpecialText();
	capStatus = cap.getCapStatus();
	partialCap = !cap.isCompleteCap();
	fileDateObj = cap.getFileDate();
	fileDate = "" + fileDateObj.getMonth() + "/" + fileDateObj.getDayOfMonth() + "/" + fileDateObj.getYear();
	fileDateYYYYMMDD = dateFormatted(fileDateObj.getMonth(),fileDateObj.getDayOfMonth(),fileDateObj.getYear(),"YYYY-MM-DD");
	var valobj = aa.finance.getContractorSuppliedValuation(capId,null).getOutput();	
	if (valobj.length) {
		estValue = valobj[0].getEstimatedValue();
		calcValue = valobj[0].getCalculatedValue();
		feeFactor = valobj[0].getbValuatn().getFeeFactorFlag();
	}
	
	var capDetailObjResult = aa.cap.getCapDetail(capId);		
	if (capDetailObjResult.getSuccess())
	{
		capDetail = capDetailObjResult.getOutput();
		var houseCount = capDetail.getHouseCount();
		var feesInvoicedTotal = capDetail.getTotalFee();
		var balanceDue = capDetail.getBalance();
	}
	var wftuDes = "Triggered when a workflow action has been taken. i.e. Approve inspection step.";
	var asDes = "Triggered when an application is submitted for the first time.";
	loadAppSpecific(AInfo); 						
	loadTaskSpecific(AInfo);						
	loadParcelAttributes(AInfo);
	loadASITablesCustom();
	
	
	
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
}

function loadASITablesCustom() {
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