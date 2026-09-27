let worker, serial=0;
const waiting=new Map();
window.condenseLookup=function(word){
  if(!/^[a-z]{1,20}$/.test(word))return Promise.reject(new Error('Use 1–20 English letters.'));
  if(!worker){
    worker=new Worker('model-worker.js');
    worker.onmessage=({data})=>{
      const status=document.getElementById('model-status');
      if(data.progress){if(status)status.textContent=data.progress;return;}
      const job=waiting.get(data.id);if(!job)return;
      waiting.delete(data.id);clearTimeout(job.timer);
      if(status)status.textContent=data.error?'': 'Language model ready';
      if(data.error)job.reject(new Error(data.error));else job.resolve(data);
      if(status)setTimeout(()=>{status.textContent='';},3500);
    };
    worker.onerror=()=>{for(const job of waiting.values()){clearTimeout(job.timer);job.reject(new Error('Could not load the language model. Please refresh and try again.'));}waiting.clear();worker.terminate();worker=null;};
  }
  return new Promise((resolve,reject)=>{
    const id=++serial;
    const timer=setTimeout(()=>{waiting.delete(id);reject(new Error('The model download is taking longer than expected. Try again.'));},180000);
    waiting.set(id,{resolve,reject,timer});worker.postMessage({id,word});
  });
};
