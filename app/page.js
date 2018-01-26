APP.onLaunch = function(){};

/**
 * Page logic
 */
Page({
    /**
     * Home page
     * @return {[type]} [description]
     */
    default: {
        onLoad: function(params) {
            APP.storage.list(function(list){
                if (list.length === 0) {
                    $('#description').show();
                } else {
                    $('#description').hide();
                }

                list.forEach((v, i) => {
                    let attached, item, groupTitleId, groupContentId;

                    switch (v.type) {
                        case 'script':
                            item = $(
                                `<a href="javascript:;" class="card__item card__item--script" target="_blank" title="Provider: ${v.provider||'null'}">
                                    <span class="pull-right"><i class="fa fa-pencil _update card__item--edit" data-name="${v.name}" /></span>
                                    ${v.name}
                                </a>`
                            );
                            break;

                        case 'url':
                            item = $(
                                `<a href="${v.content}" class="card__item card__item--url" target="_blank" title="Provider: ${v.provider||'null'}">
                                    <img src="${v.content.match(/(http(s)?:\/\/[^\/]+)/)[1]}/favicon.ico" class="site__icon" />
                                    <span class="pull-right"><i class="fa fa-pencil _update card__item--edit" data-name="${v.name}" /></span>
                                    ${v.name}
                                </a>`
                            );
                            break;
                    }

                    item.click((e) => {
                        if (e.target.tagName.toUpperCase() == 'I') {
                            APP.route('create', {
                                name: $(e.target).data('name')
                            });
                            e.cancelBubble = true;
                            return false;
                        }

                        switch(v.type) {
                            case 'script':
                                chrome.tabs.executeScript(null,
                                    {
                                        code: v.content,
                                        allFrames: false
                                    }
                                );
                                return false;

                            case 'url':
                                return true;
                        }

                        return false;
                    });

                    groupTitleId = 'CARD'+ window.btoa(encodeURIComponent(v.group)).replace(/=/g, '');
                    groupContentId = groupTitleId +'Content';
                    attached = $('#'+ groupTitleId);
                    if (attached.size() === 0) {
                        $(
                            `<div class="row list-group mb-xs">
                                <a href="javascript:;" id="${groupTitleId}" class="list-group-item active card__title" data-status="expand">
                                    <span class="badge _close" data-status="expand"><i class="fa fa-chevron-down" /></span>
                                    ${v.group}
                                </a>
                                <div id="${groupContentId}" class="card__items"></div>
                            </div>`
                        ).appendTo('#page-default');

                        // expand and close the items
                        attached = $('#'+ groupTitleId);
                        attached.click(function(){
                            var el = $(this),
                                toExpand = el.data('status')!='expand' ? true : false;

                            el.closest('.list-group').find('.card__items')[toExpand ? 'slideDown' : 'slideUp']('fast');
                            el.data('status', toExpand?'expand':'close');
                            el.find('i').toggleClass('fa-chevron-down').toggleClass('fa-chevron-up')
                        });
                        /*attached.find('._addGroup').click((e) => {
                            APP.route('create');
                            e.cancelBubble = true;
                            return false;
                        });*/
                    }

                    $('#'+ groupContentId).append(item);
                });

                let imgs = document.getElementsByTagName('img');
                let imgHolder = './icon16-gray.png';
                for (let i=0, l=imgs.length; i<l; i++) {
                    imgs[i].onerror = function(){
                        this.src = chrome.extension ? chrome.extension.getURL(imgHolder) : imgHolder;
                    }
                }
            });

            this.onShow(params);
        },

        onShow: function(params) {
            let page = $('#page-default');

            if (params && params.action === 'edit') {
                page.addClass('mode__edit');
            } else {
                page.removeClass('mode__edit');
            }
        }
    },

    /**
     * Create & update page
     * @return {[type]} [description]
     */
    create: {
        data: {
            formInstance: null
        },

        onLoad: function(params = {}) {
            let groupNameMapping = {};

            APP.storage.list((list) => {
                list.forEach((v, i) => {
                    groupNameMapping[v.group] = true;
                });

                let fieldsConfig, formInstance;

                fieldsConfig = {
                    // label    : 'Add Action',
                    size    : 'sm',
                    buttons : {
                        className: 'col-lg-2 col-lg-offset-2',
                        items   : [
                            {
                                label   : 'Test',
                                type    : 'button',
                                events  : {
                                    click: function(){
                                        let content = $.trim($('#content').val());

                                        if (content) {
                                            chrome.tabs.executeScript(null,
                                                {
                                                    code: content,
                                                    allFrames: false
                                                },
                                                function(){
                                                    // execute compelete whatever is success
                                                    // console.log("executeScript complete");
                                                }
                                            );
                                        }
                                    }
                                }
                            },
                            {
                                label   : 'Save',
                                type    : 'submit'
                            }
                        ]
                    },

                    items   : [
                        {
                            name    : 'name',
                            label   : 'Name',
                            type    : 'text',
                            genre   : 'string',
                            counter : [1, 64],
                            required: true
                        },
                        {
                            name    : 'type',
                            label   : 'Type',
                            required: true,
                            type    : 'radio',
                            genre   : 'string',
                            items   : [
                                {label: 'Script', value:'script'},
                                {label: 'URL', value:'url'}
                            ],
                            value   : 'script'
                        },
                        {
                            name    : 'content',
                            label   : 'Content',
                            required: true,
                            genre   : 'string',
                            type    : 'textarea',
                            attrs   : {
                                rows    : 10,
                                placeholder: 'Coding javascript here for type Script; or fully website url here for type URL'
                            }
                        },
                        {
                            name    : 'group',
                            label   : 'Group',
                            type    : 'select',
                            required: true,
                            genre   : 'string',
                            items   : (() => {
                                let items = [];
                                Object.keys(groupNameMapping).forEach((v) => {
                                    typeof v==='string' && items.push({
                                        label: v,
                                        value: v
                                    });
                                });
                                items.push({
                                    label: '-- Create New... --',
                                    value: ''
                                });
                                return items;
                            })(),
                            events  : {
                                complete: () => {
                                    // choose the first option
                                    setTimeout(() => {
                                        $('#group option:first').prop('selected', true);
                                    }, 0);
                                },
                                change: function() {
                                    // append the new option and select it.
                                    if (! this.value) {
                                        let name = $.trim(window.prompt('Group Name:'));

                                        name && $(this).append(`<option value="${name}">${name}</option>`)
                                            .find(`option[value="${name}"]`).prop('selected', true);
                                    }
                                    return false;
                                }
                            }
                        },
                        {
                            name    : 'provider',
                            label   : 'Provider',
                            type    : 'text',
                            genre   : 'string',
                            counter : [1, 64],
                            attrs   : {
                                placeholder: '(optional)'
                            }
                        }
                    ]
                };

                formInstance = new FormUI.Construct(fieldsConfig, '#page-create');
                formInstance.onSubmit = data => {
                    if (this.data.info) {
                        // if name changed, should delete it and re-create it with new name.
                        if (this.data.info.name != data.name) {
                            APP.storage.remove(this.data.info.name, d => {
                                console.log('remove old success', d);

                                APP.storage.insert(data, d => {
                                    console.log('insert new success')

                                    APP.relaunch('default');
                                    APP.route('default');
                                }, () => { 
                                    alert('Save failed.')
                                });
                            }, () => {
                                alert('Save failed.')
                            });
                        } else {
                            APP.storage.update(data, d => {
                                console.log('update success', d)

                                APP.relaunch('default');
                                APP.route('default');
                            }, () => {
                                alert('Save failed.')
                            });
                        }
                    } else {
                        // insert first, then try update if failed
                        APP.storage.insert(data, d => {
                            console.log('insert success')

                            APP.relaunch('default');
                            APP.route('default');
                        }, () => { 
                            alert('Save failed.')
                        });
                    }

                    return false;
                };
                formInstance.onChange = function(){
                    return false;
                };

                this.setData({
                    formInstance: formInstance
                });

                this.resume(params.name);
            });
        },

        resume: function(name) {
            this.data.formInstance.reset();

            if (name) {
                APP.storage.get(name, (data) => {
                    if (data) {
                        FormUI.setData(data);
                        this.setData({
                            'info': data
                        });
                    } else {
                        this.setData({
                            'info': null
                        });
                    }
                });
            }
        },

        onShow: function(params) {
            this.resume(params.name);
        }
    },

    /**
     * Setting page
     * @return {[type]} [description]
     */
    settings: {
        onLoad: function() {
            let fieldsConfig, formInstance,
                _m = this;

            fieldsConfig = {
                size    : 'sm',
                items   : [
                    {
                        name    : 'import_file',
                        label   : 'Import from file',
                        type    : 'file',
                        events  : {
                            change: function() {
                                var reader = new FileReader();
                                reader.onload = e => {
                                    console.log(e.target.result);
                                    _m.import(e.target.result);
                                };
                                // reader.readAsBinaryString(this.files[0]);
                                reader.readAsText(this.files[0], 'UTF-8');
                                return false;
                            }
                        },
                        hint: `File should written in JSON, example as follow:<pre class="small row">  [
    {
      // Item with the same group name will be grouped.
      // Please remove all comment lines before use.
      "group": "Private Tool",
      "name": "Auto Login",
      "type": "script",
      "content": "alert('code here...')",
      "provider": "Author name or website"
    },
    {
      "group": "Favorite Sites",
      "name": "Google",
      "type": "url",
      "content": "https://www.google.com/",
      "provider": "Google Inc."
    }
  ]</pre>`
                    },
                    {
                        name    : 'import_url',
                        label   : 'or Import from url',
                        type    : 'textarea',
                        postfix : '<button id="btnImportUrl" class="btn btn-sm btn-success" style="position: absolute;right: 15px;bottom: 0;">Import</button>',
                        value   : 'http://tools99.kaifage.com/list.json',
                        events  : {
                            complete: function() {
                                $('#page-settings').find('#btnImportUrl').unbind('click').click(() => {
                                    let url = $('#import_url').val();

                                    url += (url.indexOf('?') ? '?' : '') +'&_='+ Math.random();

                                    APP.util.getRemoteData(url, content => {
                                        _m.import(content);
                                    }, () => {
                                        alert('Network error, try later.');
                                    });

                                    return false;
                                });
                            }
                        },
                        hint: 'Response format is described above.'
                    }
                ]
            };

            formInstance = new FormUI.Construct(fieldsConfig, '#page-settings');
            formInstance.onSubmit = data => {
                return false;
            };
            formInstance.onChange = function(){
                return false;
            };
        },

        import: function(content) {
            try {
                if (! content) {
                    alert('Empty content');
                    return false;
                }

                content = typeof content==='string' ? JSON.parse(content) : content;

                if (!$.isArray(content) || content.length<1 || !content[0].name || !content[0].group || !content[0].content) {
                    alert('Error content');
                    return false;
                }

                content.forEach((v, i) => {
                    !v.type && (v.type = 'script');
                    APP.storage.insert(v, () => {
                        console.log(v.name +' import success');
                    });
                });
                
                setTimeout(() => {
                    APP.relaunch('default');
                    alert('Import complete');
                    APP.route('default');
                }, 200);
            } catch(err) {
                alert('Invalid JSON format, please review it.');
            }
        }
    }
});
