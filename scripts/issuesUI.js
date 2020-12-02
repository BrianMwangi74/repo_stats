let endDateInputIssues       = document.getElementById("endDateIssues");
let startDateInputIssues     = document.getElementById("startDateIssues");
let nextPageButtonIssues     = document.getElementById("nextPageButtonIssues");
let previousPageButtonIssues = document.getElementById("previousPageButtonIssues");
let issuesAmountInput = document.getElementById("issuesAmount");
let stateInput = document.getElementById("issuesState");

let state = "open";
let currentHandler;

let openIssues = new PagedDataHandler(styleIssues, ()=>{console.log("Error!")}, openUrlFunction);
let closedIssues = new PagedDataHandler(styleIssues, ()=>{console.log("Error!")}, closedUrlFunction);
let allIssues = new PagedDataHandler(styleIssues, ()=>{console.log("Error!")}, allUrlFunction);

function openUrlFunction(startDate, endDate, amount, currentPage){
  return repoStats.makeIssuesUrl(startDate, endDate, amount, currentPage, "open");
}
function closedUrlFunction(startDate, endDate, amount, currentPage){
  return repoStats.makeIssuesUrl(startDate, endDate, amount, currentPage, "closed");
}
function allUrlFunction(startDate, endDate, amount, currentPage){
  return repoStats.makeIssuesUrl(startDate, endDate, amount, currentPage, "all");
}

function showIssues(){
  let startDate = new Date(startDateInputIssues.value);
  let endDate = new Date(endDateInputIssues.value);
  let amount = parseInt(issuesAmountInput.value);
  state = stateInput.value.toLowerCase();

  let tableHeader = document.getElementById("issueTableHeader");

  if(state === "closed issues"){
    currentHandler = closedIssues;
    tableHeader.innerHTML = `
    <th scope="col">Opened</th>
    <th scope="col">Closed</th>
    <th scope="col">Author</th>
    <th scope="col">Issue</th>`;
  }
  else if(state === "all" || state === "claimed-unclaimed issues"){
    currentHandler = allIssues;
    tableHeader.innerHTML = `
    <th scope="col">Opened</th>
    <th scope="col">State</th>
    <th scope="col">Claimed</th>
    <th scope="col">Author</th>
    <th scope="col">Issue</th>`;
  }
  else{
    currentHandler = openIssues;
    tableHeader.innerHTML = `
    <th scope="col">Opened</th>
    <th scope="col">Author</th>
    <th scope="col">Issue</th>`;
  }
  currentHandler.init(startDate, endDate, amount);
}

function previousPageIssues(){
  currentHandler.previousPage();
}

function nextPageIssues(){
  currentHandler.nextPage();
}

function setButtonStatesIssues(){
  if(currentHandler.isLastPage()){
    nextPageButtonIssues.disabled = true;
  }
  else{
    nextPageButtonIssues.disabled = false;
  }
  if(currentHandler.isFirstPage()){
    previousPageButtonIssues.disabled = true;
  }
  else{
    previousPageButtonIssues.disabled = false;
  }
}

function styleIssues(issues){
  let styleFunction;
  if(state === "closed issues"){
    styleFunction = closedStyle;
  }
  else if(state === "all" || state === "claimed-unclaimed issues"){
    styleFunction = claimedStyle;
  }
  else{
    styleFunction = openStyle;
  }

  let table = document.getElementById('issuesTableData');
  table.innerHTML = "";
  for (let i = 0; i < issues.length; i++) {
      let author = issues[i].user.login;
      let startDate = new Date(issues[i].created_at);
      let endDate = new Date(issues[i].closed_at);
      let title = issues[i].title;

      let tr = document.createElement('tr');
      tr.setAttribute("class", 'commit-row');
      tr.setAttribute("data-toggle", 'modal');
      tr.setAttribute("data-target", '#issuesModal');
      tr.addEventListener('click', ()=>{
          fillIssuesModal(startDate, endDate, issues[i]);
      });
      tr.innerHTML = styleFunction(author, startDate, endDate, title, issues[i]);
      table.appendChild(tr);
  }

  setButtonStatesIssues();
}

function formatDate(date, separator){
  if(separator == undefined){
    separator = "<br>"
  }
  if(date != undefined){
      if(new Date('January 1, 1971 04:20:00') > date){
        return "not yet";
      }
      else{
        return `${date.getHours()}:${date.getMinutes() + separator + date.toLocaleDateString()}`;
      }

  }
  else{
    return "undefined";
  }
}

function openStyle(author, startDate, endDate, title, issue){
  return `<td>${formatDate(startDate)}</td><td>${author}</td><td>${title}</td></tr>`;
}

function closedStyle(author, startDate, endDate, title, issue){
  return `<td>${formatDate(startDate)}</td><td>${formatDate(endDate)}</td><td>${author}</td><td>${title}</td></tr>`;
}

function claimedStyle(author, startDate, endDate, title, issue){
  let claimed = "No";
  if(issue.assignees.length > 0){
    claimed = "Yes";
  }
  return `<td>${formatDate(startDate)}</td><td>${issue.state}</td><td>${claimed}</td><td>${author}</td><td>${title}</td></tr>`;
}


// Fills the commit modal with the data about the given commit
function fillIssuesModal(startDate, endDate, issue){
  document.getElementById("issuesGitLink").setAttribute("onclick", `location.href='${decodeURIComponent(issue.html_url)}'`);
  document.getElementById("issuesModalTitle").innerHTML = issue.title;
  let body = `<p>State: ${issue.state}</p>
  <p>Opened at: ${formatDate(startDate, ", ")}</p>
  <p>Closed at: ${formatDate(endDate, ", ")}</p>
  <p>Author: ${issue.user.login}</p>
  <p>Contributors: `;
  let comma = "";
  for(let i=0; i < issue.assignees.length; i ++){
    body += comma + issue.assignees[i].login;
    comma = " ,";
  }
  body += `.</p><p>${issue.body}</p>`;

  document.getElementById("issuesModalBody").innerHTML = body;
}
