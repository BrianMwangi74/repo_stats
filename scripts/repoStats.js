// RepoStats object
// Encapsulated for data hiding - https://www.intertech.com/Blog/encapsulation-in-javascript/
let repoStats = (function()
{
  // Private methods/variables
  let repo;
  let generalData = null;

  let clientID = "edff186a0593ad08d27a";
  let clientSecret = "36854df5c763b9ed10e71991854bbb87ea9f79ff";

  let commitsHandler;
  let issuesHandler;

  // List of contributors
  let contributors = new Set();

  // Recursively get pages of developer events until exhausted or reached 30 days in the past
  function getDeveloperContributionTypesAux(developer, eventTypes, pageNo, callback, error)
  {
    repoStats.getRequest(`https://api.github.com/users/${developer}/events?page=${pageNo}&${repoStats.appArguments()}`, (data) => {
      let lastMonth = new Date();
      lastMonth.setDate(lastMonth.getDate() - 30);
      // Parse data for events from this repository
      data.forEach(e => {
        // If not within the last month
        if(e.created_at < lastMonth)
        {
          callback(eventTypes);
          return;
        }

        if(e.repo.name == repo.pathname.slice(1))
        {
          if(eventTypes.hasOwnProperty(e.type))
          {
            eventTypes[e.type]++;
          } else {
            eventTypes[e.type] = 1;
          }
        }
      });
        
        // Response is empty or If reached last API page
        if(data.length === 0 || pageNo === 10)
        {
          callback(eventTypes);
        } else {
          // Get next page
          getDeveloperContributionTypesAux(developer, eventTypes, ++pageNo, callback, error);
        }
          
      }, error);
  }

  // Public methods/variables
  return {

    //By appending this arguments to urls github api recognise requests as coming from the GIT47 app
    //And grants us 5000 requests/hour
    //The clientSecret should be exchanged only on a server to serer communication.
    //If the app is going to be published on the internet this security issue needs to be addressed
    appArguments: function(){
      return "client_id=" + clientID + "&client_secret=" + clientSecret;
    },


    //This function simply prints what is the request Limit
    //How many requests left and the date when it is going to reset
    testAppLimits: function(xhttp){
      let limit = xhttp.getResponseHeader("X-RateLimit-Limit");
      let remaining = xhttp.getResponseHeader("X-RateLimit-Remaining");
      let reset = xhttp.getResponseHeader("X-RateLimit-Reset");

      console.log("Limit " + limit + "   Remaining " + remaining + "   Reset "  + (new Date(parseInt(reset) * 1000)));
    },

    // Retrieves general repository data and passes it to a callback
    // Error is a function which is called if the requests failed
    getGeneralData: function(callback, error)
    {
      if(generalData == null)
      {
        // Create httprequest to query Github API
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
          // Check the query was successful
          if(this.readyState == 4 && this.status == 200)
          {
            // Parse response JSON into object
            generalData = JSON.parse(xhttp.responseText);
            callback(generalData);
          } else if (this.readyState == 4)
          {
            error();
          }
        }
          // Send request
          xhttp.open("GET", "https://api.github.com/repos" + repo.pathname + "?" + repoStats.appArguments());
          xhttp.send();
      } else
      {
        callback(generalData);
      }
    },
    // Sets the repository being accessed
    // Clears cached data if the repository has changed
    setRepository: function (url)
    {
      // if (repo != undefined && url !== repo.toString())
      // {
      //
      // }
      repo = new URL(url);
    },

    // Returns a URL object containing the repository
    getRepository: function()
    {
      return repo;
    },

    //Return the owner and the name of the repository in this format owner/repo
    getRepositoryName: function(){
      return repo.pathname;
    },

    // Makes a GET request and passes the response to a callback function
    // Error is a function which is called if the request fails
    getRequest: function(requestURL, callback, error)
    {
      // Create httprequest to query Github API
      let xhttp = new XMLHttpRequest();
      xhttp.onreadystatechange = function()
      {
        // Check the query was sucessful
        if(this.readyState == 4 && this.status == 200)
        {
          // Parse response JSON into object
          requestResponse = JSON.parse(xhttp.responseText);

          callback(requestResponse);
        } else if (this.readyState == 4)
        {
          error();
        }
      }
        // Send request
        xhttp.open("GET", requestURL);
        xhttp.send();
    },
    // Returns the amount of open issues for the repository
    // Callback is a function which is called when the data has been received with
    // the issues count as the argument
    // Error is a function which is called if the request fails e.g if the url
    // is invalid, no internet connection
    getIssuesCount : function (callback, error)
    {
      if (repo == null)
      {
        throw new Error("Repository has not been specified");
      }
      if(generalData == null)
      {
        // Create httprequest to query Github API
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
        // Check the query was sucessful
          if(this.readyState == 4 && this.status == 200)
          {
            // Parse response JSON into object
            generalData = JSON.parse(xhttp.responseText);

            callback(generalData["open_issues"]);
          } else if (this.readyState == 4)
          {
            error();
          }
        }
        // Send request
        xhttp.open("GET", "https://api.github.com/repos" + repo.pathname + "?" + repoStats.appArguments());
        xhttp.send();
      } else
      {
        return generalData["open_issues"];
      }

    },

    //make a GET request and return both data and the link header
    requestWithLink : function (url, callback, error, async)
    {
      if (repo == null)
      {
        throw new Error("Repository has not been specified");
      }
        let asyncRequest = async;
        if(async === undefined)
          asyncRequest = true;

        // Create httprequest to query Github API
        let xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function()
        {
        // Check the query was sucessful
          if(this.readyState == 4 && this.status == 200)
          {
            // Parse response JSON into object
            let data = JSON.parse(xhttp.responseText);
            let link = xhttp.getResponseHeader("link");

            callback(data, link);
          } else if (this.readyState == 4)
          {
            error();
          }
        }


        // Send request
        xhttp.open("GET", url, asyncRequest);
        xhttp.send();

    },

    //return the url to request an amount of commits between start and end date at a page
    makeCommitsUrl : function (startDate, endDate, amount, currentPage){
      return "https://api.github.com/repos" + repo.pathname + "/commits?per_page=" + amount + "&page=" + currentPage + "&since=" + startDate.toISOString() + "&until=" + endDate.toISOString() + "&" + repoStats.appArguments();

    },

    //return the url to request an amount of issues between start and end date at a page
    makeIssuesUrl : function (startDate, endDate, amount, currentPage, state){
      if(state === undefined){
        state = "open";
      }
      return "https://api.github.com/repos" + repo.pathname + "/issues?state="+state+"&per_page=" + amount + "&page=" + currentPage + "&since=" + startDate.toISOString() + "&until=" + endDate.toISOString() + "&" + repoStats.appArguments();
    },

    // Passes an array of objects containing the no. of commits and lines changed for the
    // top 100 contributing developers to a repository to a callback function
    // Each object has the following properties - author, totalCommits, linesChanged
    getDeveloperContributions : function(callback, error){
      repoStats.getRequest("https://api.github.com/repos" + repo.pathname + "/stats/contributors" + "?" + repoStats.appArguments(), (data) => {
        let parsedData = [];

        data.forEach((item, index) => {
          // Add new contributors to global list
          contributors.add(item.author.login);

          entry = {author: item.author, totalCommits: item.total, linesChanged: 0};
          item.weeks.forEach((item, index) => {
            entry.linesChanged += item.a + item.d;
          });

          parsedData.push(entry);
        });

        callback(parsedData);
      }, error);
    },

    // Passes the an object containing the amount of lines added/deleted in a
    // given commit to callback
    // commit is the sha identifier for a commit
    getCommitLinesChanged : function(commit, callback, error){
      repoStats.getRequest("https://api.github.com/repos" + repo.pathname + "/commits/" + commit + "?" + repoStats.appArguments(), (data) =>{
        callback(data.stats);
      }, error);
    },

    // Passes an object containing the number of open/closed issues in the repository
    // to a given callback function
    getIssuesOpenedClosed : function(callback, error){
      let stats = {open: undefined, closed: undefined};
      // Open issues count
      repoStats.getGeneralData((data) => {
        // Total issues count
        stats.open = data.open_issues_count;
        repoStats.getRequest("https://api.github.com/repos" + repo.pathname + "/issues?per_page=1&" + repoStats.appArguments(), (issues) => {
          stats.closed = issues[0].number - stats.open;

          callback(stats);
        }, error);
      }, error);
    },

    // Passes the amount of commits in the last no. of weeks to a callback
    // up to a maximum of 52 weeks
    getCommitsCount: function(weeks, callback, error) {
      if(isNaN(weeks) || weeks < 1 || weeks > 52 || !Number.isInteger(weeks))
      {
        throw new RangeError("weeks must be an integer between 1 and 52");
        error();
        return;
      }
      repoStats.getRequest("https://api.github.com/repos" + repo.pathname + "/stats/participation?" + repoStats.appArguments(), (data) => {
        let count = 0;
        for(let i=0; i < weeks; i++)
          count += data.all[i];
        callback(count);
      }, error)
    },


    //This function counts how many issues any assignees contributed to.
    //It sorts the users in descending order (most issues contributed first) and
    //returns that list
    //Every item in the list has the following properties:
    //  item.username: the username of the user
    //  item.count: the number of issues the user contributed to
    //  item.avatar_url: the url of the user image
    getContributorsList: function(closedIssues){

      let contributors = new Object();     //initialize a dictionary
      for(let i =0; i < closedIssues.length; i++){    //for all issues
        for(let j = 0; j < closedIssues[i].assignees.length; j++){   //for all contributors
          let username =  closedIssues[i].assignees[j].login;
          let avatar = closedIssues[i].assignees[j].avatar_url;
          if(contributors[username] === undefined){               //if we don't know this user we initialize it with 1 issue
            contributors[username] = {count: 1, avatar_url: avatar};   //every contributor has a count and the avatar url
          }
          else{                                                   // otherwise we just increase its count by one
            contributors[username].count += 1;
          }
        }
      }

      let contributorsList = new Array();     //now we transform the contributors into a list
      for(let login in contributors) {
        let value = contributors[login];
        contributorsList.push({username: login, count: value.count, avatar_url: value.avatar_url});
      }

      contributorsList = contributorsList.sort((a, b)=>{   //sort the contributors in descending order of solved issues
          return b.count < a.count ?  -1 : b.count > a.count ? 1 : 0;
      });

      return contributorsList;
    },

    //This function iteratively requests all issues in the last month from the github api
    //It puts all the issues in a list and passes it to a callback
    getLastMonthIssues: function(callBack, error){
      let pages = new Array();
      let today = new Date();
      let oneMonthAgo = new Date();
      oneMonthAgo.setDate(today.getDate()-30);

      let pageNumber = 1;
      let url = repoStats.makeIssuesUrl(oneMonthAgo, today, 100, pageNumber, "all");
      repoStats.requestWithLink(url, recurse, error);
      //This function is the call back to the request.
      function recurse(data, link){
        let lastPage = new Page(data, link, pageNumber);
        pages.push(lastPage);
        if(!lastPage.isLast()){  //if there are more pages available request them
          pageNumber += 1;
          let nextUrl = repoStats.makeIssuesUrl(oneMonthAgo, today, 100, pageNumber, "all");
          repoStats.requestWithLink(nextUrl, recurse, error);
        }
        else{  //otherwise make the list and call the callback
          let allIssues = new Array();
          for(let i =0; i < pages.length; i ++){
            allIssues = allIssues.concat(pages[i].data);
          }
          callBack(allIssues);
        }
      }
    },

    // Gets the types of contributions a developer has made over the past month
    // then passes that data to a callback
    getDeveloperContributionTypes: function(developer, callback, error){
      eventTypes = {};
      getDeveloperContributionTypesAux(developer, eventTypes, pageNo=1, callback, error);
    },

    // Adds a developer to the list of contributors
    addContributor: function(name){
      contributors.add(name);
    },

    // Returns a list of the contributors which have been accessed via other methods
    getContributors: function(){
      return [...contributors];
    }
  };
})();
