import React,{useEffect,useRef} from 'react';
import * as echarts from 'echarts';
import {continueRender,delayRender,useCurrentFrame} from 'remotion';
const points=[[-657,.5],[330,.5],[447,.5],[537,.5],[1204,.5],[1261,.5],[1453,.5],[1517,.5],[1853,.5],[1923,.5],[1973,.5],[1988,.5],[2013,.5],[2026,.5]];
export const TimelineGraphic:React.FC<{frame:number;fps:number}> = ({frame,fps}) => {
  const el=useRef<HTMLDivElement>(null);const chart=useRef<echarts.ECharts|null>(null);const f=useCurrentFrame();
  useEffect(()=>{
    if(!el.current)return;
    const handle=delayRender('Initializing ECharts timeline');
    const c=echarts.init(el.current,undefined,{renderer:'svg'});chart.current=c;
    c.setOption({animation:false,grid:{left:8,right:8,top:10,bottom:24},xAxis:{type:'value',min:-700,max:2050,axisLine:{lineStyle:{color:'#c6bdad'}},axisLabel:{color:'#f2e8d8',fontSize:11,formatter:(v:number)=>v<0?`${-v} BCE`:String(v)},splitLine:{show:false},axisTick:{show:false}},yAxis:{show:false,min:0,max:1},series:[{type:'line',data:[[-657,.5],[2026,.5]],symbol:'none',lineStyle:{color:'#b99c59',width:2}},{type:'scatter',data:points,symbolSize:5,itemStyle:{color:'#f1dda7'}}]});
    continueRender(handle);
    return()=>{c.dispose();chart.current=null;};
  },[]);
  useEffect(()=>{if(!chart.current)return;const year=-657+Math.min(1,f/(420*fps))*2683;chart.current.setOption({series:[{data:[[-657,.5],[year,.5]]},{data:points.filter(p=>p[0]<=year)}]});},[f,fps]);
  return <div ref={el} style={{width:'100%',height:'100%'}}/>;
};
