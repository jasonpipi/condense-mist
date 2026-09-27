let loading,words,index,vectors;
async function load(){
  if(loading)return loading;
  loading=(async()=>{
    self.postMessage({progress:'Loading language model (about 84 MB)…'});
    const wr=await fetch('model/words.json');if(!wr.ok)throw Error('Vocabulary download failed. Try again.');
    words=await wr.json();index=new Map(words.map((w,i)=>[w,i]));vectors=new Float32Array(words.length*50);
    let offset=0;
    for(let i=0;i<5;i++){
      self.postMessage({progress:`Loading language model: ${i+1} / 5…`});
      const r=await fetch(`model/vectors-${i}.bin`);if(!r.ok)throw Error('Model download failed. Try again.');
      const a=new Float32Array(await r.arrayBuffer());vectors.set(a,offset);offset+=a.length;
    }
    if(offset!==vectors.length)throw Error('Incomplete model download. Please reload.');
  })().catch(e=>{loading=null;throw e;});
  return loading;
}
function nearest(word){
  const q=index.get(word);if(q===undefined)throw Error('That word is not in the vocabulary. Try another.');
  const base=q*50,top=[];
  for(let i=0;i<words.length;i++){
    if(i===q)continue;
    let score=0;const at=i*50;
    for(let j=0;j<50;j++)score+=vectors[base+j]*vectors[at+j];
    if(top.length<7||score>top[top.length-1].score){top.push({word:words[i],score});top.sort((a,b)=>b.score-a.score);if(top.length>7)top.pop();}
  }
  return top;
}
self.onmessage=async({data:{id,word}})=>{
  try{if(!/^[a-z]{1,20}$/.test(word))throw Error('Use 1–20 English letters.');await load();self.postMessage({id,word,results:nearest(word)});}
  catch(e){self.postMessage({id,error:e.message});}
};
