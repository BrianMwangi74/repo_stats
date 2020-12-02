// Resets the commit range date picker in the UI
function resetDates(){
  let today = new Date();
  let lastWeek = new Date();
  lastWeek.setDate(today.getDate()-7);
  document.getElementById("endDateCommits").valueAsDate = today;
  document.getElementById("startDateCommits").valueAsDate = lastWeek;
  document.getElementById("endDateIssues").valueAsDate = today;
  document.getElementById("startDateIssues").valueAsDate = lastWeek;
}

// Called when there is a problem with a request to the GitHub API
function requestError()
{
  throw new Error("Something went wrong. Ensure you have entered a valid url and you are connected to the internet.");
}

// Represents the commits that have been loaded so far
repoStats.setRepository(findGetParameter("url"));
// Set default datepicker values
resetDates();
// Create timeline
showCommits();
showIssues();

//Get all the issues in the last month
repoStats.getLastMonthIssues((issues)=>{
  let closedIssues = new Array();
  let openIssues = new Array();

  for(let i = 0; i < issues.length; i ++){
    if(issues[i].state === "open"){
      openIssues.push(issues[i]);
    }
    else{
      closedIssues.push(issues[i]);
    }
  }

  let contributorsList = repoStats.getContributorsList(closedIssues);
  fillContributorsTable(contributorsList);


  // Average time to close issues
  let average = 0;
  let issueOpened, issueClosed;
  let today = new Date();
  issues.forEach(issue => {
    average += Math.round((
            (issue.closed_at ? new Date(issue.closed_at).getTime() : today.getTime())
            - new Date(issue.created_at).getTime())
            / 86400000)});
  average = Math.round(average / issues.length);
  document.getElementById("avgTimeResolveIssues").innerHTML = `${average} days`;

  // Proportion of issues per developer
  devs = {};
  issues.forEach(issue => {
    issue.assignees.forEach(dev => {
      // Add unique developers to contributors list
      repoStats.addContributor(dev.login);
      // Initialise dev entry if not present
      if(devs.hasOwnProperty(dev.login))
      {
        devs[dev.login][issue.state]++;
      } else {
        devs[dev.login] = {"open": 0, "closed": 0};
        devs[dev.login][issue.state]++;
      }
    });
  });

  displayDeveloperIssuesCompletionChart(devs);

  // Display developer contribution types chart
  displayDeveloperContributionTypesChart(repoStats.getContributors());

}, ()=>{  //when there is a connection problem
  let mainDevelopers = document.getElementById("mainDevelopers");
  mainDevelopers.innerHTML= '<div class="col-12"><p>It seems like there is a connection error :(</p></div>';
});

//This function fills the table of contributors.
//developers must be a sorted list of developers where every item has
//an username, an avatar_url and a count field.
//The list must be sorted in descending order according to count
function fillContributorsTable(developers){
  let mainDevelopers = document.getElementById("mainDevelopers");
  let spinner = document.getElementById("spinner");
  spinner.style.display="none";
  if(developers.length>0){      //if there is some data available

    let max = developers[0].count;
    let i = 0;

    while(( developers[i].count === max || i < 8 || i %4 != 0 ) && i < developers.length){    //list all the developers who contributed to the most number of issues
        mainDevelopers.innerHTML += formatDeveloper(developers[i]);                           //and fit others to have at least 8 and multiple of 4
      i += 1;
    }

  }else{  //When no one has been assigned to a issue
    mainDevelopers.innerHTML= '<div class="col-12"><p>It seems like no one was assigned to any issue.</p></div>';
  }
}

//format developer data into html string.
//this is used above to make the main developers table
//developer must have avatar_url, username and count fields.
function formatDeveloper(developer){
  return `<div class="col-12 col-sm-6 col-md-3">
    <div class="row">
      <div class="col-4 center-block">
        <img class="avatar" src="${developer.avatar_url}"  alt="">
      </div>
      <div class="col-8 username">
        <h5>${developer.username}</h5>
      </div>
    </div>
    <div class="row">
      <div class="col-12 text-center">
        <p>Contributed to ${developer.count} issues</p>
      </div>
    </div>
  </div>`;
}

// Get general repository overview data
repoStats.getGeneralData((data) => {
  // Date Created
  let dateString = new Date(data.created_at).toDateString();
  document.getElementById("dateCreated").innerHTML = dateString;

  // Most Recent Commit
  dateString = new Date(data.pushed_at).toString();
  document.getElementById("mostRecentCommits").innerHTML = dateString.slice(0, 24);

  // Setting repository name
  document.getElementById("repoName").innerText = data.name[0].toUpperCase() + data.name.slice(1, data.name.length);

}, () => {
  requestError();
});

// Get the no. of commits over the past weeks
repoStats.getCommitsCount(weeks=1, (count) => {
  document.getElementById("numCommits").innerHTML = count;
}, () => {
  requestError();
});

// Issues Count Functionality
repoStats.getIssuesCount((issuesCount) => {
  // Display issues count
  document.getElementById("numIssues").innerHTML = issuesCount;
},
// Error getting issues count
() => {
  // Invalid url or no internet connection
  requestError();
});

// Author lines changed / total no. of commits
repoStats.getDeveloperContributions((data) => {
  // Display lines changed per developer
  displayContributionChart(data);
}, () => {
  requestError();
});

//Get number of issues closed/open
repoStats.getIssuesOpenedClosed((data) => {
    // Display issues pie chart using fetched data
    displayIssuesChart(data);
}, () => {
    console.log("Something went wrong. Ensure you have entered a valid url and you are connected to the internet.");
});

