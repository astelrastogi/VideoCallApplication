function renderTime(){
    //Date
    let mydate = new Date();
    let myyear = mydate.getYear();
    if(myyear<1000){
        myyear+=1900;
    }
    var day = mydate.getDay();
    var month = mydate.getMonth();
    var dayOfMonth= mydate.getDate();
    var dayArray = new Array("Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday");
    var monthArray = new Array("Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec");

    //Time
    var currentTime = new Date();
    var h = currentTime.getHours();
    var m = currentTime.getMinutes();
    var s = currentTime.getSeconds();
    if(h==24){
        h=0;
    }
    else if(h>12){
        h=h-0;
    }
    if(h<10){
        h = "0" + h;
    }
    if(m<10){
        m="0"+m;
    }
    if(s<10){
        s="0"+s;
    }
    var myClock = document.getElementById("displayTime");
    myClock.textContent = ""+dayArray[day]+"  •  "+ monthArray[month]+" "+dayOfMonth+" "+myyear+ "  •  "+
    h+":"+m+":"+s; 
    myClock.innerText = ""+dayArray[day]+"  •  "+ monthArray[month]+" "+dayOfMonth+" "+myyear+ "  •  "+
    h+":"+m+":"+s; 

    setTimeout("renderTime()",1000);

}

renderTime();