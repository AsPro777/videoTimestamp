import React from 'react';
import './App.css';
import { useState , useEffect, useRef } from 'react';
import  AnalyticItemsProp   from './interfaces/AnalyticItemsInterface';
import  AnalyticItemsTimestampProp from './interfaces/AnalyticItemsTimestampInterface';

import { MouseEventHandler , SyntheticEvent } from "react";

function App() {
  const [analyticItems, setAnalyticItems] = useState<AnalyticItemsProp[]>([]);
  const [rectangleDivs , setRectangleDivs] = useState<JSX.Element[] | JSX.Element>([]);
  const [isTimestampChange , setIsTimestampChange] = useState(false);

  let rectRef=useRef<JSX.Element[]>([]);

  type dateFormatMS = {
    minutes: number;
    seconds: number;
    miliseconds: number;
  }

  useEffect(()=>{
    fetch('http://www.mocky.io/v2/5e60c5f53300005fcc97bbdd')
     .then(res=>res.json())
     .then( (result)=> {  
      result.sort((a : AnalyticItemsProp, b : AnalyticItemsProp) => Number(a.timestamp) - Number(b.timestamp));
      setAnalyticItems(result);  
     }
    )
   },[])

   /*формирование прямоугольной рамки по координатам из массива analyticItems в момент времени ms */
   function makeRect(ms:number): JSX.Element[]
   {
      const newItems : JSX.Element[] =[];

      if(analyticItems) {
         analyticItems.forEach((item,index)=> {
           let elem=document.querySelector(`[data-id="${index}"]`);
           let ind=index;
           let timestampStart=Math.round(Number(item.timestamp)/100);
           let timestampEnd=Math.round((Number(item.timestamp) + Number(item.duration))/100);
 
           if( (ms>=timestampStart) && (ms<=timestampEnd )) {
                
                newItems.push(<div data-id={String(ind)} style={{border: '2px solid green' , 
                                                              position: 'relative',
                                                              width: item.zone.width+'px',
                                                              height: item.zone.height+'px',
                                                              top: item.zone.top+'px',
                                                              left: item.zone.left+'px'}}></div>) 
           }
           else{
             if(elem) newItems.splice(ind, 1); 
           }
         })
      }
      
      return newItems;
   }

   /*список событий аналитики*/
   function timestamp_(child: AnalyticItemsTimestampProp[] ): JSX.Element | JSX.Element[] 
   {
       const newItems : JSX.Element[] =[];
   
       child.map(
           (str,id) => (
               newItems.push(<AnalyticItem key={id.toString()}
                                           id={id}
                                           timestamp={str.timestamp}
                                           />)
           )
       )
       return newItems;
       
    } 

    /*вывод события в формате MM:SS:sss*/
    function dateFormat(timestamp : number) : dateFormatMS {
       let value = Math.floor(timestamp/1000);
       let miliseconds= Number(timestamp)%1000;
       let minutes = Math.floor(value/60);
       let seconds=value-(minutes*60);

       return {
        minutes: minutes,
        seconds: seconds,
        miliseconds: miliseconds
       }
    }

    function AnalyticItem({ id , timestamp }: AnalyticItemsTimestampProp): JSX.Element 
    {
       let date : dateFormatMS= dateFormat( timestamp);
       let divId=String(id);
       return (
         <div className='analytic-items-main-div__item' id={divId} onClick={choiseTimestamp} >{
          ("0"+ date.minutes).slice(-2)   + ":" + 
          ("0"+ date.seconds).slice(-2)   + ":" +
          ("0"+ date.miliseconds).slice(-3) 
          }</div>
       )
    }

    /*позиционирование видео по клику из списка событий*/
    const choiseTimestamp : MouseEventHandler = (event)=> {
      let divChoiseId=Number(event.currentTarget.id);
      let valueMSec=analyticItems[divChoiseId].timestamp;
      let valueSec=Number(valueMSec)/1000;

      let rectangles =  makeRect(Math.round(valueMSec/100));
      setRectangleDivs(rectangles);

      let videoElement = document.getElementById("id-video");
      if(videoElement) (videoElement as HTMLVideoElement).currentTime=valueSec; 

      setIsTimestampChange(true);
    }

    /*позиционирование видео при его воспроизведении*/
    const timeUpdate= (e: SyntheticEvent<HTMLVideoElement>)=> {
        if(isTimestampChange) return;
        else {
          let ms=Math.round(Math.round(e.currentTarget.currentTime*1000)/100);
          
          let rectangle : JSX.Element[]=makeRect(ms);  
          if(rectangle.length!==rectRef.current.length){
            rectRef.current=rectangle;
            setRectangleDivs(rectangle);
          }
          else {
            if((rectangle.length!==0) && (rectRef.current.length!==0)) {
              for(let i=0;i<rectangle.length;i++) {
                    if(rectangle[i].props["data-id"] !== rectRef.current[i].props["data-id"]){
                    rectRef.current=rectangle;
                    setRectangleDivs(rectangle);
                  }
                }
            }
          }
        }
    } 

  const changeIsTimestamp = (e: SyntheticEvent<HTMLVideoElement>) => {  setIsTimestampChange(false);  } 

  return (
    <div className="App">
     <div className='video-div'>
       <div className='video-div__element'>
         <video id='id-video' width="850" height="600" controls onTimeUpdate={timeUpdate} onPlay={changeIsTimestamp} onSeeked={changeIsTimestamp}>
          <source src={"http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4"} type="video/mp4"/>
         </video>
       </div>
        {rectangleDivs} 
    </div>
     {analyticItems && 
       <div className='analytic-items-main-div'>
         {timestamp_(analyticItems)}
       </div>}
    </div>
  );
}

export default App;
