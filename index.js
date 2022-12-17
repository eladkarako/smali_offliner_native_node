"use strict";

const  time_start_global = Number(new Date())
      ,log               = console.log.bind(console /*,"[INFO]"*/)
      ,resolve_path      = function(path){ //a fully qualified path
                             path = path || "";
                             path = path.replace(/\"/g,"").replace(/\\+/g,"/");
                             path = require("path").resolve(path);
                             path = path.replace(/[\/\\]+/g,"/").replace(/\/+$/g,"");
                             return path;
                           }
      ,folders           = process.argv.slice(2)
      ,fs_promises       = require("fs/promises")
      ,read_options      = {encoding : "utf8"
                           ,signal   : AbortSignal.timeout(3 * 60 * 1000) //3 minutes to finish writing or it gets timeout.
                           }
      ,write_options     = read_options
      ,pattern_smali     = /\.smali$/i
      ,pattern_content   = /(\-\>isconnec.*)($\s*)move-result ([^\s].*)$/igm
      ;


function string_float_pad(n){
  return n.toFixed(4)
          .split(".")
          .map((s,index)=>{
             return (0 === index ? s.padStart(2,"0") : s.padEnd(4,"0"));
          })
          .join(".")
          ;
}

function object_simplify_for_serialization(o_input, is_to_string){
  is_to_string = ("boolean" === typeof is_to_string ? is_to_string : true); //default true.
  
  const o_output = new Object(null)
       ,supers   = []
       ;
  for(;null !== o_input;){
    supers.push(o_input);
    o_input = Object.getPrototypeOf(o_input);
  }
  supers.reverse()
        .forEach(single_super=>{
           Object.keys(single_super)
                 .forEach(key=>{
                    o_output[key] = single_super[key]; //will overwrite itself, last value is from the object.
                 });
        });

  let o_result = new Object(null);
  Object.keys(o_output)
        .sort()
        .forEach(key=>{
           o_result[key] = o_output[key];
        });

  if(is_to_string){
    o_result = JSON.stringify(o_result, null, 2)
                   .replace(/,[\r\n] /g, "\r\n ,")
                   .replace(/ *(,( +))/g,"$2,")
                   ;
  }
  return o_result;
}


(async ()=>{"use strict";



async function list_all_files(folder, pattern){
  let files   = []
     ,folders = []
     ;

  (await fs_promises.readdir(folder, {encoding:"utf8",withFileTypes:true}))
  .forEach(entry=>{
     const path   = resolve_path(folder + "/" + entry.name)
          ,target = (entry.isFile() ? files : entry.isDirectory() ? folders : [])
          ;
     target.push(path);
  });

  if(folders.length > 0){
    let recursive_results = await Promise.allSettled( folders.map(folder=>list_all_files(folder, pattern)) );
    recursive_results     = recursive_results.map(recursive_result=>recursive_result.value || []);
    recursive_results.forEach(recursive_result=>{
      files = [].concat(files, recursive_result);
    });
  }

  if("undefined" !== typeof pattern){
    files = files.filter(file=>pattern.test(file));
  }

  return files;
}


async function read_match_edit(file, pattern){

  let content   = await fs_promises.readFile(file, read_options);
  const matches = Array.from(content.matchAll(pattern));


  if(!matches.length){
    const err = new Error("no match");
    err.value = {file:file, matches_length:0}; //have additional information in the rejected result.
    throw err;
  }


  //fs.writeFileSync(file + ".bak", read_options); //optional. not advised though! you'll have to delete those files yourself manually before compiling smali to dex (to apk).

  matches.forEach(match=>{
    const  whole_match             = match[0]
          ,method_until_end        = match[1]
          ,whitespace_after_method = match[2]
          ,variable_only           = match[3]
          ;

    if(!whole_match || !method_until_end || !whitespace_after_method || !variable_only) return;

    const  reconstructed_line = method_until_end
                              + whitespace_after_method + "####" + "move-result " + variable_only
                              + whitespace_after_method + "const/4 " + variable_only + ", 0x0"
           ;
    content = content.replace(whole_match, reconstructed_line);
  });

  await fs_promises.writeFile(file, content, write_options);
  return {file:file,matches_length:matches.length}; //resolve
}


async function folder_handler(folder){
  const time_start        = Number(new Date())
       ,files             = await list_all_files(folder, pattern_smali)
       ,files_result      = await Promise.allSettled( files.map(file=>read_match_edit(file, pattern_content)) )
       ,successful_result = files_result.filter(single_result=>("fulfilled" === single_result.status))
       ,report            = {}
       ;

  report.folder = {};
  report.folder.as_is            = folder;
  report.folder.resolved         = resolve_path(folder);
  report.folder.resolved_windows = report.folder.resolved.replace(/\/+/gm,"\\");
  //----------------------------------------- extract just paths and matches for file, from Promise.allSettled files_result array
  report.files_success = {};
  files_result.filter(single_result=>("fulfilled" === single_result.status))
              .forEach(single_result=>{
                 report.files_success[ single_result.value.file ] = single_result.value.matches_length;
              });

  //----------------------------------------- some folder statistics
  report.statistics = {}
  report.statistics.total               = files_result.length;

  report.statistics.success             = successful_result.length;
  report.statistics.success_percent     = (report.statistics.success * 100) / report.statistics.total;
  report.statistics.success_percent_s   = string_float_pad( report.statistics.success_percent );

  report.statistics.failed              = (report.statistics.total - report.statistics.success);
  report.statistics.failed_percent      = (report.statistics.failed * 100) / report.statistics.total;
  report.statistics.failed_percent_s    = string_float_pad( report.statistics.failed_percent );

  report.time_in_seconds = Math.max(1, Math.round((Number(new Date()) - time_start) / 1000));

  return report;
}






const folders_reports = (await Promise.allSettled( folders.map(folder=>folder_handler(folder)) ))
                        .map(result=>result.value)
                        ;
folders_reports.time_total_in_seconds = Math.max(1, Math.round((Number(new Date()) - time_start_global) / 1000));


log(object_simplify_for_serialization(folders_reports));


queueMicrotask(() => {  //delay task. not really needed, just to be safe. https://nodejs.org/api/process.html#when-to-use-queuemicrotask-vs-processnexttick
  process.exitCode=0;
  process.exit();
});

})();

