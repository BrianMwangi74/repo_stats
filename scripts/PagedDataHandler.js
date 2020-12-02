/*
This class represents a PagedDataHandler, which is able to store and serve several Pages of data
between multiple date intervals. It also keeps track of the current data range, and the current page
in this data range. It specifies functions to get the previous and next pages.
*/
class PagedDataHandler{
  constructor(displayerFunction, errorFunction, urlFunction){
    this.displayerFunction = displayerFunction;
    this.errorFunction = errorFunction;
    this.urlFunction = urlFunction;
    this.pagesArray = new Array();
    this.currentPage = 1;
    this.currentDatePage = 1;
  }

  //Initialize a new Pages between a start and end date and with a particular amount.
  //If the Pages is already created, it is reused.
  init(startDate, endDate, amount){
    if(amount !== 25 && amount !== 50 && amount !== 100)
      amount = 25;

    if(!isNaN(startDate) && !isNaN(endDate) && startDate < endDate){
      this.currentPage = 1;
      for(let i = 0; i < this.pagesArray.length; i++){   //look if we have it stored
        if(this.pagesArray[i].startDate == startDate && this.pagesArray[i].endDate == endDate){
          this.currentDatePage = i;
          this.pagesArray[i].amount = amount;
          this.pagesArray[i].requestPage(this.currentPage, this.displayerFunction, this.errorFunction); //serve it
          return;
        }
      }

      //otherwise create a new Pages
      let newPages = new Pages(startDate, endDate, this.urlFunction);
      newPages.amount = amount;
      this.pagesArray.push(newPages);
      this.currentDatePage = this.pagesArray.length - 1;
      newPages.requestPage(this.currentPage, this.displayerFunction, this.errorFunction);
    }
    else{
        alert("Please enter valid dates");
    }
  }

  //Get the next page of data
  nextPage(){
    if(this.currentPage < this.pagesArray[this.currentDatePage].getLastPageNumber()){
      this.currentPage +=1;
    }
    this.pagesArray[this.currentDatePage].requestPage(this.currentPage, this.displayerFunction, this.errorFunction);
  }

  //Get the previous page of data
  previousPage(){
    if(this.currentPage > 1){
      this.currentPage -=1;
    }
    this.pagesArray[this.currentDatePage].requestPage(this.currentPage, this.displayerFunction, this.errorFunction);
  }

  //Get a particular page of data
  atPage(page){
    if(page > 0 && page <= this.pagesArray[this.currentDatePage].getLastPageNumber()){
      this.currentPage = page;
      this.pagesArray[this.currentDatePage].requestPage(this.currentPage, this.displayerFunction, this.errorFunction);
    }
    else{
        this.errorFunction();
    }
  }

  //Check if it is the first page
  isFirstPage(){
    return this.currentPage == 1;
  }

  //Check if it is the last page
  isLastPage(){
    return this.currentPage >= this.pagesArray[this.currentDatePage].getLastPageNumber();
  }

  //Get the current page number
  getCurrentPage(){
    return this.currentPage;
  }

  //Get the last page number
  getCurrentLastPageNumber(){
    return this.pagesArray[this.currentDatePage].getLastPageNumber();
  }
}
