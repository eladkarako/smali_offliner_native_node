a re-work on smali_offliner_for_windows,  
but using native node (not using 'DIR'). 

<hr/>

<a href="https://paypal.me/%65%31%61%64%6B%61%72%61%6B%30/%35%55%53%44" title="show your support">♥</a>  

<br/>

- no external process and buffers.
- similar to first iteration of smali_offliner.
- whenever there is an array of data to be processed in parallel promise allSettled is used (better than loop and await)
  so input for the program which is array of starting-point folders, 
  and whenever recursive folder listing finds out folder has sub-folders - those will be parallel processed,  
  and all files read-match pattern-write are done in parallel as well.
- promise allSettled result will carry information even for rejected promise, which in my case it means file does not match the pattern.
  but I still return the file full path.
- when a file is matched against the pattern, I also keep the number of matches and add that to the report as useful information, it is revealed in the promise allSettled result.
- time it took to process each "starting-point" folder, as a rounded up number of seconds.
- total time it took to run the program (in seconds).
- no progress reports for now (although it is possible). a single report is written in a json compatible output at the end to the STDOUT.
- no reporting of files not matching (since there could be a ton of those..), only successfully modified files are specified in the report.

<hr/>

if you'll run `node index.js dummy_folder__00_original` for the first time you'll get

```json
{
  "0": {
    "folder": {
      "as_is": "dummy_folder__00_original"
     ,"resolved": "D:/DOS/android/bin/SMALI_~4/dummy_folder__00_original"
     ,"resolved_windows": "D:\\DOS\\android\\bin\\SMALI_~4\\dummy_folder__00_original"
    }
   ,"files_success": {
      "D:/DOS/android/bin/SMALI_~4/dummy_folder__00_original/foo.smali": 1
     ,"D:/DOS/android/bin/SMALI_~4/dummy_folder__00_original/b/bar.smali": 1
    }
   ,"statistics": {
      "total": 3
     ,"success": 2
     ,"success_percent": 66.66666666666667
     ,"success_percent_s": "66.6667"
     ,"failed": 1
     ,"failed_percent": 33.333333333333336
     ,"failed_percent_s": "33.3333"
    }
   ,"time_in_seconds": 1
  }
 ,"time_total_in_seconds": 1
}
```

note that the statistics tells in total that there are 3 files,  
and 2 modified.  
this is because `/b/nomatch.smali` is just a file that doesn't match..

<hr/>

when you run the command again,  
there will be no matched since all the files that could be,  
were modified already, so the patten will not match them.  
as a result you'll get the following result:  

```json
{
  "0": {
    "folder": {
      "as_is": "dummy_folder__00_original"
     ,"resolved": "D:/DOS/android/bin/SMALI_~4/dummy_folder__00_original"
     ,"resolved_windows": "D:\\DOS\\android\\bin\\SMALI_~4\\dummy_folder__00_original"
    }
   ,"files_success": {}
   ,"statistics": {
      "total": 3
     ,"success": 0
     ,"success_percent": 0
     ,"success_percent_s": "00.0000"
     ,"failed": 3
     ,"failed_percent": 100
     ,"failed_percent_s": "100.0000"
    }
   ,"time_in_seconds": 1
  }
 ,"time_total_in_seconds": 1
}
```

<hr/>

you can dump the STDOUT to a file an have a look at it later,  
or loop through the data in the `folders_reports`,  
and format it to something nicer to look at...

<hr/>

note:  

`object_simplify_for_serialization` turns anything to object,  
so it you'll avoid using it keep in mind that the objects above where `"0":` is used,  
it means it was just an array, and that was its first item...


<hr/>

note `D:\DOS\android\bin\smali_offliner_native_node` is where I've placed the project,  
when runned with `index.cmd` the current work folder is set to the "8.3" short format  
which is `D:\DOS\android\bin\SMALI_~4`  
it helps to manage working even if you've placed the folder in a long path.  

<hr/>

note:  
`index.cmd` includes some language related fixes,  
the 3rd+ lines means nothing for Windows, but it helps with NodeJS.  
since there isn't OS-related mechanisem to just set `LC_ALL`,  
I'll have to set most of them.

```cmd
@echo off
chcp 65001 1>nul 2>nul
set "LANG=en_US.UTF-8"
set "LANGUAGE=en_US"
set "LC_CTYPE=en_US.UTF-8"
set "LC_NUMERIC=en_US.UTF-8"
set "LC_TIME=en_US.UTF-8"
set "LC_COLLATE=en_US.UTF-8"
set "LC_MONETARY=en_US.UTF-8"
set "LC_MESSAGES=en_US.UTF-8"
set "LC_PAPER=en_US.UTF-8"
set "LC_NAME=en_US.UTF-8"
set "LC_ADDRESS=en_US.UTF-8"
set "LC_TELEPHONE=en_US.UTF-8"
set "LC_MEASUREMENT=en_US.UTF-8"
set "LC_IDENTIFICATION=en_US.UTF-8"
set "LC_ALL=en_US.UTF-8"
```

<hr/>

optional stuff you can add (not used):  

- `NODE_DISABLE_COLORS=1` - to avoid escape-codes in the STDOUT.  
- `NODE_OPTIONS=--use-largepages=silent --zero-fill-buffers` - allow larger allocation and pre-zeroed bufferes for security reasons.
- `NODE_SKIP_PLATFORM_CHECK=1` - if you're using Windows 7..
- `NODE_NO_WARNINGS=1` - doesn't do much.

