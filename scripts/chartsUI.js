Chart.defaults.global.defaultFontColor = 'black';
Chart.defaults.global.defaultFontFamily = 'Arial';
Chart.defaults.global.defaultFontSize = 20;
function displayIssuesChart(data) {

    document.getElementById("issuesChartSpinner").style.display = "none";
    let pie1 = document.getElementById("issuesChart").getContext('2d');
    let iChart = new Chart(pie1, {
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    data.open,
                    data.closed,
                ],
                backgroundColor: [
                    "#cc25ad",
                    "#03a9fc",
                ],
                label: 'Dataset 1'
            }],
            labels: [
                'Open',
                'Closed/Removed',
            ]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Proportion of Issues Open and Closed/Removed'
            }
        }
    });}

    function displayContributionChart(parsedData){
    //sort top 100 developers array by lines changed
    document.getElementById("contributionChartSpinner").style.display = "none";
  let pie2 = document.getElementById("contributionChart").getContext('2d');
    let cChart = new Chart(pie2,{
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    parsedData[parsedData.length-1].linesChanged,
                    parsedData[parsedData.length-2].linesChanged,
                    parsedData[parsedData.length-3].linesChanged,
                    parsedData[parsedData.length-4].linesChanged,
                    parsedData[parsedData.length-5].linesChanged,
                ],
                backgroundColor: [
                    "#fcb603",
                    "#fc5a03",
                    "#03a9fc",
                    "#2cb320",
                    "#cc25ad",
                ],
                label: 'Dataset 1'
            }],
            labels: [
                parsedData[parsedData.length-1].author.login,
                parsedData[parsedData.length-2].author.login,
                parsedData[parsedData.length-3].author.login,
                parsedData[parsedData.length-4].author.login,
                parsedData[parsedData.length-5].author.login,
            ]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Contribution by Top 5 Developers (Lines Changed)'
            }
        }
    });

}

// Displays a chart which allows the choice of a developer and 
// displays the proportion of their assigned issues that
// have been solved in the past month
function displayDeveloperIssuesCompletionChart(developers)
{
    let items = "";
    Object.entries(developers).forEach(dev => {
        items += `<option value='${JSON.stringify(dev[1])}'>${dev[0]}</option>`;
    });

    let dropDown = document.getElementById("issuesCompletionDropDown");
    dropDown.innerHTML = items;
    dropDown.setAttribute("onChange", "updateIssuesCompletionChart()");

    document.getElementById("issuesCompletionChartSpinner").style.display = "none";
    updateIssuesCompletionChart();
}

let issuesDevChart;
// Display issues open/closed for developer
function updateIssuesCompletionChart()
{
    let data = JSON.parse(document.getElementById("issuesCompletionDropDown").value);
    let pie3 = document.getElementById("issuesCompletionChart").getContext('2d');
    // Destroy old chart before creating new one, otherwise wired UI issues
    if(issuesDevChart) issuesDevChart.destroy();
    issuesDevChart = new Chart(pie3, {
        type: 'pie',
        data: {
            datasets: [{
                data: [
                    data.open,
                    data.closed,
                ],
                backgroundColor: [
                    "#128C9B",
                    "#F16F22",
                ],
                label: 'Dataset 1'
            }],
            labels: [
                'Open',
                'Closed/Removed',
            ]
        },
        options: {
            responsive: true,
            title: {
                display: true,
                text: 'Proportion of Issues Completed in the Past Month (Per User)'
            }
        }
    });
}

// Displays a chart which shows the types of contributions a developer has made over the past month
function displayDeveloperContributionTypesChart(developers)
{
    let items = "";
    developers.forEach(dev => {
        items += `<option value='${dev}'>${dev}</option>`;
    });

    let dropDown = document.getElementById("developerContributionTypesDropDown");
    dropDown.innerHTML = items;
    dropDown.setAttribute("onChange", "updateDeveloperContributionChart()");

    let pie4 = document.getElementById("developerContributionTypesChart").getContext('2d');

    document.getElementById("contributionTypesChartSpinner").style.display = "none";
    updateDeveloperContributionChart();
}

let contributionTypesChart;
// Updates the developer contribution types chart to the chosen developer
function updateDeveloperContributionChart(){
    let chosenDev = document.getElementById("developerContributionTypesDropDown").value;

    repoStats.getDeveloperContributionTypes(chosenDev, (data) => {
        // If data is empty
        if (Object.entries(data).length == 0){
            document.getElementById("developerContributionHeader").innerHTML = `<center>No Contributions Found for ${chosenDev}</center>`;
            return;
        }

        document.getElementById("developerContributionHeader").innerHTML = "";
        let pie4 = document.getElementById("developerContributionTypesChart").getContext('2d');
        // Destroy old chart before replacement, otherwise charts are stacked causing strange UI bugs
        if(contributionTypesChart) contributionTypesChart.destroy();
        contributionTypesChart = new Chart(pie4, {
            type: 'pie',
            data: {
                datasets: [{
                    data: Object.values(data),
                    backgroundColor: [
                        "#DF442B",
                        "#9D2D4A",
                        "#488B65",
                        "#F4EAA5",
                        "#F3B037",
                        "#6A818C",
                        "#E3EAED"
                    ],
                    label: 'Dataset 1'
                }],
                labels: Object.keys(data),
            },
            options: {
                responsive: true,
                title: {
                    display: true,
                    text: 'Developer Contribution Types in the Past Month'
                }
            }
        });

    }, () => {console.log("Failed to retrieve developer contribution types");});
}
