// 관리자 회원 번호
var admin_number = ["13140068", "4"];

// data schema (local storage)
var local_data, v;

var tools = {
    datenow : function(){
        var d = new Date();
        return d.getFullYear() + "/" + d.getMonth() + "/" + d.getDate();
    },
    appendBlockTR : function(post){
        Array.from(post.children).forEach((td)=>{td.className += " info-td"});
        post.innerHTML += '<td class="block-td" colspan="6" \
                           style="color:#3493ff; text-align:center; font-weight:700; opacity: 0.5;">\
                           차단 되었습니다</td>'
    },
    appendBlockDIV: function(comment){
        var height = comment.clientHeight;
        comment.children[0].className += " info-div";

        comment.innerHTML += '<div class="block-div" \
                              style="height:'+ height +'px;\
                              line-height:' + height +'px;">\
                              차단 되었습니다</div>';
    }
}

var defineData = () => {
    // "local_data" would be synced with Chrome local storage area constantly.
    local_data = {
        blocked_members : Array(),
        /*
        blocked members is a array of objects
        [
        {
            date:
            member_num:
            memo:
        },
        ...
        ]
        */
        blocked_keyword : Array(),
        block_option : true,
    };
    
    // temp data (would not be synced)
    v = {
        posts: Array(),
        blocked_count : 0,
        blocked_comment_count : 0
    };
}

// initialize
var init = () =>{
    defineData();
    loadOptions();
    chrome.runtime.sendMessage({msg:"init", data: local_data}, function(result){
        // data sync with local storage
        if(result != undefined)
            local_data = result;

        // get posts from document
        collectPosts();
        // block posts
        if (options.post.enable)
            blockPosts();
        if (options.comment.enable)
            blockComments();
        // create block button
        createButton();

        // run MutationObserver to detect comment section page changes
        waitComments();
    });
};

var collectPosts = () =>{
    var td = document.querySelectorAll("td.author");
    v.posts = Array.from(td).map(x => x.parentElement);
};

var blockPosts = () => {
    if(v.posts.length != 0 && local_data.blocked_members.length !=0){
        v.posts.forEach((post) => {
            var num = post.querySelector('td.author').children[0]
                                                    .className
                                                    .match(/\d+/g)[0];
            var idx = local_data.blocked_members.findIndex(x => x.member_num == num);
            if(idx > -1){
                // +1 post comment counter
                v.blocked_count++;

                if(options.post.method == "hide")
                    post.hidden = true;
                else if(options.post.method == "block"){
                    tools.appendBlockTR(post);
                }
            }
            if(admin_number.includes(num) && options.general.noticeBlock){
                post.hidden = true;
            }
        });
    }
    updateBlockCounter();
};

var blockComments = () => {
    if(document.getElementsByClassName("comment-item").length != 0 && local_data.blocked_members.length !=0){
        var comments = document.getElementsByClassName("comment-item");
        var users = document.getElementsByClassName("comment-list")[0].querySelectorAll(".link-reset");
        users = Array.from(users).map(x => x.className.match(/(\d+)/)[0]);

        v.blocked_comment_count = 0;

        for(var i=0; i<comments.length;i++){
            if(local_data.blocked_members.findIndex(x=> x.member_num == users[i]) > -1){
                v.blocked_comment_count++;

                if(options.comment.method=="hide"){
                    comments[i].hidden = true;
                }else if(options.comment.method="block"){
                    tools.appendBlockDIV(comments[i]);
                }
            }
        }
        
        updateBlockCounter();
        hoverBlockedComment();
    }
};

var addBlockMember = (post, num = 0, mm = "") => {
    
    var member_info = {
        date: tools.datenow(),
        member_num: num,
        memo : mm
    }

    local_data.blocked_members.push(member_info);

    // push block information to local storage
    chrome.runtime.sendMessage({msg:"addBlockMember", data: member_info}, (response) =>{
        if(response)
            console.log("addBlockMember - successfully blocked member list updated");
        else
            console.log("addBlockMember - duplication exists or error occured");
    });

    // hide post
    if(document.getElementsByClassName("board-list")[0].contains(post)){
        v.blocked_count++;
    }else{
        v.blocked_comment_count++;
    }
    
    
    if(post.nodeName == "TR"){
        // if it is post
        if(options.post.method == "hide"){
            post.hidden = true;
        }
        else if(options.post.method == "block"){
            tools.appendBlockTR(post);
        }
    }else if (post.nodeName="DIV"){
        // if it is comment
        if(options.comment.method=="hide"){
            post.hidden = true;
        }else if(options.comment.method="block"){
            tools.appendBlockDIV(post);
        }
    }

    updateBlockCounter();
};

var updateBlockCounter = () =>{
    var counter = document.getElementById("pBlockCounter");
    
    // for post
    if(counter == null){
        counter = document.createElement('b');
        counter.innerHTML = "차단 글 수 - " + v.blocked_count.toString();
        counter.id = "pBlockCounter";
        counter.setAttribute("style", "color:red; margin-left: 10px;");

        var upper_menu = document.querySelector(
        "#main > div > div.eq.section.secontent.background-color-content > div > div.ed.board-list > div:nth-child(2) > div.ed.flex.flex-wrap.flex-middle.margin-top-small.margin-bottom-small > div"
        );

        upper_menu.appendChild(counter);
    }else{
        counter.innerHTML = "차단 글 수 - " + v.blocked_count.toString();
    }

    // for comments
    var comment_counter = document.getElementById("cBlockCounter");

    if(document.getElementById("comment_top") != null){
        if(comment_counter == null){
            comment_counter = document.createElement('b');
            comment_counter.innerHTML = "차단 댓글 수 - " + v.blocked_comment_count.toString();
            comment_counter.id = "cBlockCounter";
            comment_counter.setAttribute("style", "color:red; margin-top:35px; margin-left: 15px;");
            
            document.querySelector("#commentbox").prepend(comment_counter)
        }else{
            comment_counter.innerHTML = "차단 댓글 수 - " + v.blocked_comment_count.toString();
        }
    }
}; 

function createButton(){
    document.addEventListener('DOMSubtreeModified', (evt)=>{
        if(evt.srcElement.id == 'popup_menu_area'){
            var ul = evt.srcElement.firstChild;
            if(ul != undefined || ul != null){
                // get member number
                var member = ul.children[0].innerHTML.match(/\d+/g)[0];

                // add block li
                ul.innerHTML = ul.innerHTML + "<li id='addBlock'><a target='#' style='color:red;'>차단</a></li>";

                // Event Handler when "차단" is clicked
                document.getElementById("addBlock").addEventListener('click', (evt) =>{
                    var memo = prompt("메모할 내용?");

                    // for post
                    var authors = document.querySelectorAll('td.author');

                    Array.from(authors).forEach((author) =>{
                        var num = author.children[0].className.match(/\d+/g)[0];
                        if(num == member){
                            // add to local storage list and block post
                            addBlockMember(author.parentElement, num, memo);
                        }
                    });

                    // when comment section is exists
                    if(document.getElementById("comment_top") != null){
                        var comment_authors = document.getElementsByClassName("comment-list")[0]
                                                      .querySelectorAll(".link-reset");

                        Array.from(comment_authors).forEach((author) => {
                            var num = author.className.match(/(\d+)/)[0];
                            if(num == member){
                                // add to local storage list and block post
                                addBlockMember(author.parentNode.parentNode.parentNode.parentNode.parentNode, num, memo);
                            }
                        });
                        hoverBlockedComment();
                    }
                });
            }
        }
    });
};

function waitComments(){
    if(document.getElementById("comment_top") != null){
        var observer = new MutationObserver((mutations)=>{
            if(options.comment.enable)
                blockComments();
        });
        observer.observe(document.getElementById("comment_top"),{
            childList: true
        });
    }
};

function hoverBlockedComment(){
    var info_div = document.getElementsByClassName("info-div");
    var block_div = document.getElementsByClassName("block-div");

    Array.from(info_div).forEach((div)=>{
        div.addEventListener('mouseleave', (evt)=>{
            evt.srcElement.style.display = "none"
            evt.srcElement.nextElementSibling.style.display= "block";
        });
    })
    Array.from(block_div).forEach((div)=>{
        div.addEventListener('mouseenter', (evt)=>{
            evt.srcElement.style.display = "none"
            evt.srcElement.previousElementSibling.style.display= "block";
        });
    })
}

init();
