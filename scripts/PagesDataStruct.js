/*
This class represents a single page of some kind of paged data such as commits or issues
*/
class Page{

  /*
  Make a page from data, link header and the current page number
  */
  constructor(data, link, pageNumber){
    this.data = data;
    this.pageNumber = pageNumber;

    if(link === null){
      this.next = undefined;  //these variables are used to see if this page is the first page, the last page or if it is in the middle
      this.last = undefined;
      this.first = true;
      this.prev = true;
    }
    else{
      let nextPatt = /<([^<>]*)>; rel="next"/i;
      let lastPatt = /<([^<>]*)>; rel="last"/i;
      let firstPatt = /<([^<>]*)>; rel="first"/i;
      let prevPatt = /<([^<>]*)>; rel="prev"/i;

      this.next = this.trueOrUndefined(link.match(nextPatt));
      this.last = this.trueOrUndefined(link.match(lastPatt));
      this.first= this.trueOrUndefined(link.match(firstPatt));
      this.prev = this.trueOrUndefined(link.match(prevPatt));
    }
  }

  //Helper function to see if a match is null or not.
  //Return undefined if null or true otherwise
  trueOrUndefined(match){
    if(match === null || match.length !== 2)
      return undefined;
    return true;
  }

  //Check if this page is the first page
  isFirst(){
    return this.first === undefined && this.prev === undefined;
  }

  //check if this page is the last page
  isLast(){
    return this.next === undefined && this.last === undefined;
  }
}

/*
This class stores and requests all the pages between a start and end date.
All pages are of size 100 to make less requests, but the user can choose to
use page size 25, 50 or 100. In this case pages will still be of size 100,
but they will appear to be of the specified size as an abstraction.
*/
class Pages{

  /*
  Construct an instance from a start and end date, and a urlFunction.
  The url function is responsible for building urls, it must be repostats.makeCommitsUrl or
  repoStats.makeIssuesUrl.

  When this constructor is called the first and the last page are requested synchronously because
  this data is needed immediately for all other requests and for the UI.
  */
  constructor(startDate, endDate, urlFunction){
    this.currentPage = 1;
    this.maxPages = 10;
    this.startDate = startDate;
    this.endDate = endDate;
    this.amount = 25;
    this.urlFunction = urlFunction;
    this.pages = new Array();
    this.lastPage;

    let firstPage;
    let url = urlFunction(this.startDate, this.endDate, 100, 1);

    repoStats.requestWithLink(url, (data, link)=>{ //request the first page
      firstPage = new Page(data, link, 1);
      this.pages.push(firstPage);
      if(firstPage.isLast()){
        this.maxPages = 1;
        this.lastPage = firstPage;
      }
      else{
        let lastPatt = /<([^<>]*)>; rel="last"/i;
        let lastUrl = link.match(lastPatt)[1];   //get the url of the last page
        let pagePatt = /&page=([\d]+)/i;
        this.maxPages = parseInt(lastUrl.match(pagePatt)[1]);  //get the value of the last page

        repoStats.requestWithLink(lastUrl, (lastData, lastLink)=>{  //request the last page
        this.lastPage = new Page(lastData, lastLink, this.maxPages);
        this.pages.push(this.lastPage);                                 //store the last page
      }, ()=>{throw new Error("Impossible to initialize Pages");}, false);

      }
    }, ()=>{throw new Error("Impossible initialize Pages");}, false);

  }

  //This function returns the total amount of pages.
  //It depends by the amount of data per page, which can be 25, 50 or 100.
  getLastPageNumber(){
    if(this.amount === 100){
      return this.maxPages;
    }
    return (this.maxPages - 1)*(100/this.amount) + parseInt(Math.min(this.lastPage.data.length, 99)/this.amount) + 1;
  }

  //This function is used to get a page at a pageNumber.
  //This number has to be between 1 and the last page.
  requestPage(pageNumber, callback, error){
    if(pageNumber > 0 && pageNumber <= this.getLastPageNumber()){
      let realPageNumber = parseInt((pageNumber-1) / (100/this.amount)) + 1;  //convert from pages in order of 25, 50 or 100 to always 100
      this.serve(realPageNumber, pageNumber, callback, error);
    }
    else{
      error();
    }
  }

  //This function is used to serve a page. If the page is not available it is requested to github server
  //realPageNumber is the real page number in base 100.
  //pageNumber is the fake page number asked by the user
  serve(realPageNumber, pageNumber, callback, error){
    for(let i = 0; i < this.pages.length; i ++){
      if(this.pages[i].pageNumber == realPageNumber){  //if the page is available
        let start =  this.calcStart(pageNumber);
        callback(this.pages[i].data.slice(start, start + this.amount));  //serve it
        return;
      }
    }

    let url = this.urlFunction(this.startDate, this.endDate, 100, realPageNumber);  //otherwise request it
    repoStats.requestWithLink(url, (data, link)=>{
      let newPage = new Page(data, link, realPageNumber);
      this.pages.push(newPage);                                        //store it
      let start = this.calcStart(pageNumber);
      callback(data.slice(start, start + this.amount));         //and finally serve it
    }, error);
  }
  
  //calculate the index at which to start serving data
  calcStart(pageNumber){
    if(this.amount === 25 ){
      let reminder = pageNumber%4;
      if(reminder === 0)
        return 75;
      return (reminder - 1) * 25;
    }
    else if(this.amount === 50){
      return Math.abs((pageNumber%2) - 1 ) * 50;
    }
    return 0;
  }

}
