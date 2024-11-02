var total_arrival_quota;
var total_arrival_completed;
var total_arrival_completed_percent;

/************************************/
function CalculateArrival() {
  var interview_data_temp  = JSON.parse(interview_statistics_arr);
  
  total_arrival_completed = 0;
  for (i = 0; i < interview_data_temp.length; i++) {
    var interview = interview_data_temp[i];
    var interview_month = interview["Interview_Date"].substring(5,7);//"2023-04-03 06:18:18"
    var interview_quarter =  getQuarterFromMonth(interview["Interview_Date"].substring(5,7), interview["Interview_Date"].substring(0,4));
    //only get complete interview & not test
    if (//(interview.InterviewState == "Complete") && 
    (currentQuarter == interview_quarter) 
      )
    {
      total_arrival_completed = total_arrival_completed + interview.completed_interviews;
    }
  }
  total_arrival_completed_percent = (100*(total_arrival_completed/total_arrival_quota)).toFixed(0);   

}


