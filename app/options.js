var options;

var loadOptions = () => {
    chrome.runtime.sendMessage({msg:"getOptions"}, function(response){
        options = response;
    })
}