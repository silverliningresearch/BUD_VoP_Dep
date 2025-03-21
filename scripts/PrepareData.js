var quota_data;
var interview_data;
var today_flight_list;
var this_month_flight_list;
var daily_plan_data;
var removed_ids_data;

var currentDate; //dd-mm-yyyy
var currentMonth; //mm
var currentYear; //yyyy
var currentQuarter; //2023-Q1, 2023-Q2
var nextDate; //dd-mm-yyyy

var download_time;

var total_completed;
var total_completed_percent;
var total_quota_completed;
var total_hard_quota;
var total_quota;
var total_arrival_quota;
/************************************/
function initCurrentTimeVars() {
  var today = new Date();

  var day = '' + today.getDate();
  var month = '' + (today.getMonth() + 1); //month start from 0;
  var year = today.getFullYear();

  if (month.length < 2) month = '0' + month;
  if (day.length < 2) day = '0' + day;

  currentDate = [day, month, year].join('-');
  currentYear = year;
  currentMonth = month; //[month, year].join('-');;
  currentQuarter = getQuarterFromMonth(currentMonth, currentYear);

  //////////
  var tomorrow = new Date();
  tomorrow.setDate(today.getDate()+1);
  var tomorrowMonth = '' + (tomorrow.getMonth() + 1); //month start from 0;
  var tomorrowDay = '' + tomorrow.getDate();
  var tomorrowYear = tomorrow.getFullYear();

  if (tomorrowMonth.length < 2) tomorrowMonth = '0' + tomorrowMonth;
  if (tomorrowDay.length < 2) tomorrowDay = '0' + tomorrowDay;

  nextDate  = [tomorrowDay, tomorrowMonth, tomorrowYear].join('-');
  
  //////////
  if (document.getElementById('year_month') && document.getElementById('year_month').value.length > 0)
  {
    if (document.getElementById('year_month').value != "current-quarter")
    {
      currentQuarter = document.getElementById('year_month').value;
    }
  }
  
  switch(currentQuarter) {
    case "2023-Q2":
      total_arrival_quota = 300;
      total_quota = 900;
      break;
    case "2023-Q3":
      total_arrival_quota = 300;
      total_quota = 900;
      break;
    case "2023-Q4":
      total_arrival_quota = 300;
      total_quota = 900;
      break;    
    case "2024-Q1":
    case "2024-Q2":      
    case "2024-Q3":          
    case "2024-Q4":              
    case "2025-Q1":                  
        total_arrival_quota = 300;
        total_quota = 900;
        break;            
    default:
      total_quota = 1;  
      total_arrival_quota = 1;
      break;
  }
}


function getQuarterFromMonth(month, year)
{
  //Input: mm, yyyy
  var quarter = 0;
  
  if ((month == '01') || (month == '02') || (month == '03')) {
    quarter = "Q1";  
  }
  else if ((month == '04') || (month == '05') || (month == '06')) {
    quarter = "Q2";  
  }
  else if ((month == '07') || (month == '08') || (month == '09')) {
    quarter = "Q3";  
  }
  else if ((month == '10') || (month == '11') || (month == '12')) {
    quarter = "Q4";  
  }
  return (year + "-" + quarter);
}

function notDeparted(flight_time) {
  var current_time = new Date().toLocaleString('en-US', { timeZone: 'Europe/Budapest', hour12: false});
  //15:13:27
  var current_time_value  = current_time.substring(current_time.length-8,current_time.length-6) * 60;
  current_time_value += current_time.substring(current_time.length-5,current_time.length-3)*1;

  //Time: 0805    
  var flight_time_value = flight_time.substring(0,2) * 60 + flight_time.substring(2,4)*1;
  var result = (flight_time_value > current_time_value);
  return (result);
}

function isvalid_id(id)
{
  valid = true;

  var i = 0;
  for (i = 0; i < removed_ids_data.length; i++) 
  { 
    if (removed_ids_data[i].removed_id == id)
    {
      valid = false;
    }
  }
  return valid;
}

function prepareInterviewData() {
  removed_ids_data = JSON.parse(removed_ids);

  var quota_data_temp = JSON.parse(airport_airline_quota);
  var interview_data_full  = JSON.parse(interview_statistics);
  var flight_list_full  = JSON.parse(BUD_Flight_List_Raw);

  initCurrentTimeVars();	
  
  //get quota data
  quota_data = [];
  quota_data.length = 0;
  for (i = 0; i < quota_data_temp.length; i++) {
    if ((quota_data_temp[i].Quota>0)
    && (quota_data_temp[i].Quarter == currentQuarter))
    {
      if (currentQuarter == "2025-Q1") 
      {
        quota_data_temp[i].Quota = Math.round(quota_data_temp[i].Quota*0.9);
      }
      quota_data.push(quota_data_temp[i]);
    }
  }
    
  //get relevant interview data
  //empty the list
  interview_data = [];
  interview_data.length = 0;

  download_time = interview_data_full[0].download_time;
  for (i = 0; i < interview_data_full.length; i++) {
    var interview = interview_data_full[i];

    var interview_quarter = getQuarterFromMonth(interview["Interview_Date"].substring(5,7), interview["Interview_Date"].substring(0,4));
    
    if (// (interview.InterviewState == "Complete") && 
      // (currentMonth == interview_month)  && 
      (currentQuarter == interview_quarter)  
      )
    {
      if (interview["Dest"]) {
        var airport_code = interview["Dest"];
        
        var airline_code = ""
        if (interview["AirlineCode"])  airline_code = interview["AirlineCode"];

        interview.Airport_Airline = airport_code + "-" + airline_code;
        interview.InterviewEndDate = interview["Interview_Date"] ;

        interview_data.push(interview);

      }
      else{
        console.log("ignored interview: ", interview);
      }
    }
  }

  //prepare flight list
  //empty the list
  today_flight_list = [];
  today_flight_list.length = 0;
  
  this_month_flight_list  = []; //for DOOP
  this_month_flight_list.length = 0;
  
  for (i = 0; i < flight_list_full.length; i++) {
    //special for BUD
    if (flight_list_full[i].Flight.substring(0,3) == "TOM") flight_list_full[i].AirlineCode = "TOM";

    if ((flight_list_full[i].Flight.substring(0,3) == "EZY") 
      || (flight_list_full[i].Flight.substring(0,3) == "EJU") 
    || (flight_list_full[i].Flight.substring(0,3) == "EZS")) flight_list_full[i].AirlineCode = "U2";

    let flight = flight_list_full[i];

    //airport_airline
    var airport_airline = flight.Dest + "-" + flight.AirlineCode; //code for compare
    flight.Airport_Airline = airport_airline;

    //only get today & not departed flight
    if (((currentDate ==flight.Date) && notDeparted(flight.Time))
        || (nextDate ==flight.Date)
        ) 
    { 
      flight.Date_Time = flight.Date.substring(6,10) + "-" +  flight.Date.substring(3,5) + "-" + flight.Date.substring(0,2) + " " + flight.Time;
      //flight.Date_Time = flight.Time;
      today_flight_list.push(flight);
    }
    
    //currentMonth: 02-2023
    //flight.Date: 08-02-2023
    if (currentQuarter == getQuarterFromMonth(flight.Date.substring(3,5), flight.Date.substring(6,10))) { 
      this_month_flight_list.push(flight);
    }		   
  }
 
  //add quota data
  daily_plan_data = [];
  daily_plan_data.length = 0;
  
  for (i = 0; i < today_flight_list.length; i++) {
    let flight = today_flight_list[i];
    for (j = 0; j < quota_data.length; j++) {
      let quota = quota_data[j];
      if ((quota.Airport_Airline == flight.Airport_Airline) && (quota.Quota>0))
      {
        flight.Quota = quota.Quota;
        daily_plan_data.push(flight);
       }
    }
  }
  // console.log("today_flight_list: ", today_flight_list);
  // console.log("quota_data: ", quota_data);
  // console.log("daily_plan_data: ", daily_plan_data);
  // console.log("interview_data: ", interview_data);
}
