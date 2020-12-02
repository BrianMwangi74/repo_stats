let endDateInputCommits       = document.getElementById("endDateCommits");
let startDateInputCommits     = document.getElementById("startDateCommits");
let nextPageButtonCommits     = document.getElementById("nextPageButtonCommits");
let previousPageButtonCommits = document.getElementById("previousPageButtonCommits");
let commitsAmountInput = document.getElementById("commitsAmount");

let commits = new PagedDataHandler(styleCommits, ()=>{console.log("Error!")}, repoStats.makeCommitsUrl);

function showCommits(){
  let startDate = new Date(startDateInputCommits.value);
  let endDate = new Date(endDateInputCommits.value);
  let amount = parseInt(commitsAmountInput.value);
  commits.init(startDate, endDate, amount);
}

function previousPageCommits(){
  commits.previousPage();
}

function nextPageCommits(){
  commits.nextPage();
}

function setButtonStatesCommits(){
  if(commits.isLastPage()){
    nextPageButtonCommits.disabled = true;
  }
  else{
    nextPageButtonCommits.disabled = false;
  }
  if(commits.isFirstPage()){
    previousPageButtonCommits.disabled = true;
  }
  else{
    previousPageButtonCommits.disabled = false;
  }
}

function styleCommits(commits){
  var tableRows = commits.map(commit => ({name: commit.commit.message, author: commit.commit.author.name, date:commit.commit.author.date}));
  var html = "";
  document.getElementById('commitsTableData').innerHTML = html;
  for (var i = 0; i < tableRows.length; i++) {
    let row = tableRows[i];
    // Get no. of lines changed for commit
      // Formatting date for readability
      let date = row.date.slice(11, 16) + "<br>";
      date += row.date.slice(8, 10) + "/" + row.date.slice(5, 7) + "/" + row.date.slice(0, 4);

      html += `<tr class='commit-row' data-toggle='modal' data-target='#commitsModal'
      onclick='fillCommitsModal("${commits[i].sha}", "${encodeURIComponent(row.name).replace(/'/g, ">>")}", "${encodeURIComponent(commits[i].html_url)}")'>
      <td>${date}</td><td>${row.author}</td><td>${row.name}</td></tr>`;
  }
  document.getElementById('commitsTableData').innerHTML = html;
  setButtonStatesCommits();

}
// Fills the commit modal with the data about the given commit
function fillCommitsModal(commitSha, commitTitle, commitUrl){
  document.getElementById("gitLink").setAttribute("onclick", `location.href='${decodeURIComponent(commitUrl)}'`);
  repoStats.getCommitLinesChanged(commitSha, (data) => {
    document.getElementById("commitsModalTitle").innerHTML = decodeURIComponent(commitTitle).replace(/>>/g, "'");
    let body = `<p>Lines Added: ${data.additions}</br>Lines Removed: ${data.deletions}</p>`;
    document.getElementById("commitsModalBody").innerHTML = body;
  }, () => {

  });
}

//Show/hide the commits table based on user input
function viewCommits() {
  let checkBox = document.getElementById("checkBox1");
  let table = document.getElementById("commitsTable");
  // If the checkbox is checked, show the table
  if (checkBox.checked === true){
    table.style.display = "block";
  } else {
    table.style.display = "none";
  }
}

//Show/hide the issues table based on user input
function viewIssues() {
  let checkBox = document.getElementById("checkBox2");
  let table = document.getElementById("issuesTable");
  // If the checkbox is checked, show the table
  if (checkBox.checked === true){
    table.style.display = "block";
  } else {
    table.style.display = "none";
  }
}

//Hide the tables by default
window.onload=function(){
viewIssues();
viewCommits();};