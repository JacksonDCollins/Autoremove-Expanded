/*
Script: autoremoveplusplus.js
    The client-side javascript code for the AutoRemovePlusPlus plugin.

Copyright:
    (C) 2020 Ervin Toth <tote.ervin@gmail.com>
    (C) 2014-2016 Omar Alvarez <osurfer3@hotmail.com>
    This program is free software; you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation; either version 3, or (at your option)
    any later version.

    This program is distributed in the hope that it will be useful,
    but WITHOUT ANY WARRANTY; without even the implied warranty of
    MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
    GNU General Public License for more details.

    You should have received a copy of the GNU General Public License
    along with this program.  If not, write to:
        The Free Software Foundation, Inc.,
        51 Franklin Street, Fifth Floor
        Boston, MA  02110-1301, USA.

    In addition, as a special exception, the copyright holders give
    permission to link the code of portions of this program with the OpenSSL
    library.
    You must obey the GNU General Public License in all respects for all of
    the code used other than OpenSSL. If you modify file(s) with this
    exception, you may extend this exception to your version of the file(s),
    but you are not obligated to do so. If you do not wish to do so, delete
    this exception statement from your version. If you delete this exception
    statement from all source files in the program, then also delete it here.
*/

Ext.namespace('Deluge.plugins.autoremoveplusplus.ui');
Ext.namespace('Deluge.plugins.autoremoveplusplus.util');

if (typeof(console) === 'undefined') {
  console = {
    log: function() {}
  };
}

Deluge.plugins.autoremoveplusplus.PLUGIN_NAME = 'AutoRemovePlusPlus';
Deluge.plugins.autoremoveplusplus.MODULE_NAME = 'autoremoveplusplus';
Deluge.plugins.autoremoveplusplus.DISPLAY_NAME = _('AutoRemovePlusPlus');
Deluge.plugins.autoremoveplusplus.CHECK_PRECISION = 4;

Deluge.plugins.autoremoveplusplus.util.isNumber = function(obj) {
  return !isNaN(parseFloat(obj))
};

Deluge.plugins.autoremoveplusplus.util.setdefault = function(obj, prop, deflt) {
  return obj.hasOwnProperty(prop) ? obj[prop] : (obj[prop] = deflt);
};

Deluge.plugins.autoremoveplusplus.util.arrayEquals = function(a, b) {
    if (a.length != b.length)
        return false;
    for (var i = 0; i < b.length; i++) {
      // recurse into the nested arrays
      if (a[i] instanceof Array && b[i] instanceof Array) {
        if (!Deluge.plugins.autoremoveplusplus.util.arrayEquals(a[i], b[i]))
          return false;
      } else {
        if(Deluge.plugins.autoremoveplusplus.util.isNumber(a[i]) && Deluge.plugins.autoremoveplusplus.util.isNumber(b[i])) {
          if (a[i].toFixed(Deluge.plugins.autoremoveplusplus.CHECK_PRECISION) !== b[i].toFixed(Deluge.plugins.autoremoveplusplus.CHECK_PRECISION))
            return  false;
        } else {
          if (a[i] !== b[i])
            return false;
        }
      }
    }
    return true;
};

Deluge.plugins.autoremoveplusplus.util.dictEquals = function(a, b) {
  var keysA = Ext.keys(a);
  var keysB = Ext.keys(b);
  if (keysA.length != keysB.length)
      return false;
  for (var i = 0; i < keysB.length; i++) {
    var key = keysA[i];
    if (key in b) {
      if (a[key] instanceof Array && b[key] instanceof Array) {
        if (!Deluge.plugins.autoremoveplusplus.util.arrayEquals(a[key], b[key]))
          return false;
      } else {
        if(Deluge.plugins.autoremoveplusplus.util.isNumber(a[key])
          && Deluge.plugins.autoremoveplusplus.util.isNumber(b[key])) {
          if (a[key].toFixed(Deluge.plugins.autoremoveplusplus.CHECK_PRECISION)
            !== b[key].toFixed(Deluge.plugins.autoremoveplusplus.CHECK_PRECISION))
            return false;
        } else  {
          if (a[key] !== b[key])
            return false;
        }
      }
    } else {
      return false;
    }
  }
  return true;
};

Deluge.plugins.autoremoveplusplus.util.dictToArray = function(dict) {
  data = [];
  var keys = Ext.keys(dict);
  for (var i = 0; i < keys.length; i++) {
    var key = keys[i];
    data.push([key,dict[key]]);
  }
  return data;
};

Deluge.plugins.autoremoveplusplus.util.LinkedStore = function (first_store, second_store, dataFieldName, linkFieldName){
  parentStore = new Ext.data.ArrayStore(first_store);
  parentStore.dataFieldName = dataFieldName;
  parentStore.linkFieldName = linkFieldName;


  childStore = new Ext.data.ArrayStore(second_store);

  childStore.on('update', function(store, record, operation){
   console.log(store)
   console.log(record.data)
    parentRecord = parentStore.getAt(parentStore.find(parentStore.linkFieldName, record.get(parentStore.linkFieldName)))
    newDataFull = [];
    for (var i = 0; i < store.getCount(); i ++){
      nd = store.getAt(i).data;
      delete nd[parentStore.linkFieldName];
      newDataFull.push(Object.values(nd))
    }
    parentRecord.set(parentStore.dataFieldName, newDataFull);

    linkedData = JSON.parse(JSON.stringify(parentRecord.get(parentStore.dataFieldName)));
    linkedData.forEach((item, i) => {
     item.unshift(parentRecord.get(parentStore.linkFieldName))
    });
    store.loadData(linkedData);
  })


  childStore.on('add', function(store, records, index){
   for (record of records){
     console.log(record)
     parentRecord = parentStore.getAt(parentStore.find(parentStore.linkFieldName, record.get(parentStore.linkFieldName)))
     newDataFull = [];
     for (var i = 0; i < store.getCount(); i ++){
       nd = store.getAt(i).data;
       delete nd[parentStore.linkFieldName];
       newDataFull.push(Object.values(nd))
     }
     parentRecord.set(parentStore.dataFieldName, newDataFull);
    }
   linkedData = JSON.parse(JSON.stringify(parentRecord.get(parentStore.dataFieldName)));
   linkedData.forEach((item, i) => {
    item.unshift(parentRecord.get(parentStore.linkFieldName))
   });
   store.loadData(linkedData);
   return false
  })

  childStore.on('remove', function(store, record, index){
   parentRecord = parentStore.getAt(parentStore.find(parentStore.linkFieldName, record.get(parentStore.linkFieldName)))
   newDataFull = [];
   for (var i = 0; i < store.getCount(); i ++){
     nd = store.getAt(i).data;
     delete nd[parentStore.linkFieldName];
     newDataFull.push(Object.values(nd))
    }
   parentRecord.set(parentStore.dataFieldName, newDataFull);
   linkedData = JSON.parse(JSON.stringify(parentRecord.get(parentStore.dataFieldName)));
   linkedData.forEach((item, i) => {
    item.unshift(parentRecord.get(parentStore.linkFieldName))
   });
   store.loadData(linkedData);

  })

   return {parentStore, childStore};
};

Deluge.plugins.autoremoveplusplus.ui.PreferencePage = Ext.extend(Ext.TabPanel, {
    title: Deluge.plugins.autoremoveplusplus.DISPLAY_NAME,
    activeTab: 0,
    initComponent: function() {
        Deluge.plugins.autoremoveplusplus.ui.PreferencePage.superclass.initComponent
          .call(this);
        // create reusable renderer
        Ext.util.Format.comboRenderer = function(combo){
          return function(value){
            if (combo.store) {
              var record = combo.findRecord(combo.valueField, value);
              return record ? record.get(combo.displayField) : value;//combo.valueNotFoundText;
            } else {
              return value
            }
          }
        }
        this.genSettingsBox = this.add({
            title: 'General Settings',
            xtype: 'panel',
            layout: {
              type: 'vbox',
              align: 'stretch'
            }
        });

        this.chkEnabled = this.genSettingsBox.add({
          xtype: 'checkbox',
          margins: '0 0 0 5',
          boxLabel: _('Enable')
        });





        this.condBuilderBox = this.add({
            title: 'Condition Builder',
            xtype: 'panel',
            layout: {
              type: 'vbox',
              align: 'stretch'
            }
        });


        this.param_combo = new Ext.form.ComboBox({
          store: new Ext.data.ArrayStore({
            autoDestroy: true,
            idIndex: 0,
            fields: ['func_id', 'func_name']
          }),
          mode: 'local',
          valueField: 'func_id',
          displayField: 'func_name',
          editable: true,
          triggerAction: 'all',
          listeners: {
            blur: function(combo){
              combo.store.clearFilter();
            }
          }
        });

        this.cond_combo = new Ext.form.ComboBox({
          store: new Ext.data.ArrayStore({
            autoDestroy: true,
            idIndex: 0,
            fields: ['disp', 'val'],
            data: [['>','>'], ['<','<'], ['=','='], ['!=','!='], ['>=','>='], ['<=', '<='],['=', 'disabled']]
          }),
          mode: 'local',
          valueField: 'val',
          displayField: 'disp',
          editable: true,
          triggerAction: 'all',
          listeners: {
            blur: function(combo){
              combo.store.clearFilter();
            }
          }
        });

        this.Label_cond_combo = new Ext.form.ComboBox({
          store: new Ext.data.ArrayStore({
            autoDestroy: true,
            idIndex: 0,
            fields: ['disp', 'val'],
            data: []
          }),
          mode: 'local',
          valueField: 'val',
          displayField: 'disp',
          editable: false,
          triggerAction: 'all',
          listeners: {
            blur: function(combo){
              combo.store.clearFilter();
            }
          }
        });





        getTypeString = function(type){
          if (Array.isArray(type)){
            return 'bcombo'
          } else if (type == 'float'){
            return 'floatspinner'
          } else if (type == 'int'){
            return 'intspinner'
          }
        };

        this.tblConds = this.condBuilderBox.add({
          xtype: 'editorgrid',
          margins: '2 0 0 5',
          flex: 1,
          autoExpandColumn: 'name',
          autoSizeColumns: true,

          viewConfig: {
            emptyText: _('Add a condition..'),
            deferEmtpyText: false
          },

          colModel: new Ext.grid.ColumnModel({
            columns: [{
              id: 'name',
              header: _('Name'),
              dataIndex: 'name',
              sortable: true,
              hideable: false,
              editable: true,
              editor: {
                xtype: 'textfield'
                }
              },{
              id: 'param',
              width: 150,
              header: _('Paramater'),
              dataIndex: 'param',
              sortable: true,
              hideable: false,
              editable: true,
              editor: this.param_combo,
              renderer: Ext.util.Format.comboRenderer(this.param_combo)
              },{
              id: 'cond',
              width: 50,
              header: _('Condition'),
              dataIndex: 'cond',
              sortable: true,
              hideable: false,
              editable: true,
              editor: this.cond_combo,
              renderer: Ext.util.Format.comboRenderer(this.cond_combo)
              },{
              // xtype: 'gridcolumn',
              id: 'value',
              header: _('Value'),
              dataIndex: 'value',
              sortable: true,
              hideable: false,
              editable: true,
              // editor:{
              //   xtype: 'textfield'
              // }
            }]
          }),

          selModel: new Ext.grid.RowSelectionModel({
            singleSelect: false,
            moveEditorOnEnter: false
          }),

          store: new Ext.data.ArrayStore({
              autoDestroy: true,
              fields: [
                {name: 'name', type: 'string'},
                {name: 'param', type: 'string'},
                {name: 'cond', type: 'string'},
                {name: 'value'},
                {name: 'value_editor'},
                {name: 'value_values'}
              ]
          }),

          listeners: {
            afteredit: function(e) {
              // console.log(e)
              e.record.commit();

              if (e.field == "param"){
                deluge.client.autoremoveplusplus.get_conds_aliases_type(e.record.get('param'), {
                  success: function(types) {
                    type = getTypeString(types);
                    // console.log(type)

                    if (type == 'bcombo'){
                      e.record.set('cond', 'disabled');
                       bdata = [];
                      for (var i = 0; i < types.length; i ++){
                        bdata.push([types[i], types[i]]);
                      }
                      e.record.set('value_values', bdata);

                    } else if (type == "floatspinner"){
                      e.record.set('cond', '');

                    } else if (type == "intspinner"){
                      e.record.set('cond', '');

                    }
                    e.record.set('value', '')
                    e.record.set('value_editor', type);
                    e.record.commit()
                  },
                  scope: this
                });
                // e.grid.getColumnModel().getColumnById('value').loadData(DATA);
              }
            },
            beforeedit: function(e){
              // console.log(e)
              if (e.field == "value"){
                // e.grid.fireEvent('afteredit', e);
                // console.log(e.record.get('value_editor'))
                if (e.record.get("value_editor") == "bcombo"){
                  bcombo = new Ext.form.ComboBox({
                        mode: 'local',
                        editable: true,
                        store: new Ext.data.ArrayStore({
                          id: 0,
                          fields: ['disp', 'val'],
                          data: e.record.get('value_values')
                        }),
                        valueField: 'val',
                        displayField: 'disp'
                      });
                  e.grid.getColumnModel().getColumnById('value').setEditor(bcombo)
                  e.grid.getColumnModel().getColumnById('value').renderer = Ext.util.Format.comboRenderer(bcombo);
                  return true
                } else if (e.record.get("value_editor") == "intspinner"){
                  e.grid.getColumnModel().getColumnById('value').setEditor({
                        xtype: 'spinnerfield',
                        value: 0,
                        maxValue: 10000,
                        minValue: 0,
                        allowDecimals: false,
                        decimalPrecision: 3,
                        incrementValue: 1,
                        alternateIncrementValue: 5
                        });
                  e.grid.getColumnModel().getColumnById('value').renderer = null
                  return true
                } else if (e.record.get("value_editor") == "floatspinner"){
                  e.grid.getColumnModel().getColumnById('value').setEditor({
                        xtype: 'spinnerfield',
                        value: 0,
                        maxValue: 10000,
                        minValue: 0,
                        allowDecimals: true,
                        decimalPrecision: 3,
                        incrementValue: 0.5,
                        alternateIncrementValue: 1.0
                        });
                  e.grid.getColumnModel().getColumnById('value').renderer = null
                  return true
                }

              }
              return !(e.field == "cond" && e.value == 'disabled')

            },
            // beforerender: function(grid){
            //   e = new Object;
            //   e.grid = grid;
            //   for (var i  = 0; i < e.grid.getStore().getCount(); i++){
            //     record = e.grid.getStore().getAt(i);
            //     e.record = record;
            //     console.log(record.data)
            //     j = 0;
            //     for (var [field, value] of Object.entries(record.data)){
            //       e.field = field;
            //       e.value = value;
            //       e.originalValue = value;
            //       e.row = i;
            //       e.column = j;
            //       j++;
            //       console.log(e)
            //       grid.fireEvent("afteredit", e);
            //   }
            //  }
            // }
          },

          setEmptyText: function(text){
            if (this.viewReady){
              this.getView().emptyText = text;
              this.getView().refresh();
            } else {
              Ext.apply(this.viewConfig, {emptyText: text});
            }
          },

          loadData: function(data) {


            var prom = new Promise((resolve, reject) => {
              data.forEach(function(val, index, arr){
                deluge.client.autoremoveplusplus.get_conds_aliases_type(val[1], {success: function(types){
                  type = getTypeString(types);
                  arr[index].push(type);
                  if (type == 'bcombo') {
                    // console.log(types)
                    bdata = [];
                    for (var i = 0; i < types.length; i ++){
                      bdata.push([types[i], types[i]]);
                    }
                    arr[index].push(bdata);
                  }
                  if (index == arr.length -1) resolve()
                },
                scope: this
                })
              })
            });

            prom.then(() => {
              this.getStore().loadData(data);
            });



            if (this.viewReady){
              this.getView().updateHeaders();
            }
          }

        });

        this.condsButtonsContainer = this.condBuilderBox.add({
          xtype: 'container',
          layout: 'hbox',
          margins: '4 0 0 5',
          items: [{
            xtype: 'button',
            text: 'Add conditon',
            margins: '0 5 0 0'
          },{
            xtype: 'button',
            text: 'Remove conditon'
          }]
        });

        this.condsButtonsContainer.getComponent(0).setHandler(function(){this.addEntry(this.tblConds)}, this);
        this.condsButtonsContainer.getComponent(1).setHandler(function(){this.removeEntry(this.tblConds)}, this);



        this.rulesBuilderBox = this.add({
            title: 'Rule Builder',
            xtype: 'panel',
            layout: {
              type: 'vbox',
              align: 'stretch'
            }
        });


        lfn = 'label'
        dfn = 'data'

        firstStore = {
         fields: [
           lfn,
           dfn
         ],
         autoDestroy: true,
         autoSave: true
        };

        secondStore = {
         fields: [
           lfn,
           {name: 'conditonName', type: 'string'},
           {name: 'requiredTime', type: 'float'},
         ],
         autoSave: true,
         autoDestroy: true
        };

        let { parentStore, childStore} = Deluge.plugins.autoremoveplusplus.util.LinkedStore(firstStore, secondStore, dfn, lfn)

        this.tblRulesConds = new Ext.grid.EditorGridPanel({
          xtype: 'editorgrid',
          margins: '2 0 0 5',
          flex: 1,
          autoExpandColumn: 'conditonName',
          autoSizeColumns: true,

          viewConfig: {
            emptyText: _('Add a rule..'),
            deferEmtpyText: false
          },

          store: childStore,

          colModel: new Ext.grid.ColumnModel({
            columns: [{
              id: 'conditonName',
              header: _('Conditon'),
              dataIndex: 'conditonName',
              sortable: true,
              hideable: false,
              editable: true,
              editor: this.Label_cond_combo,
              renderer: Ext.util.Format.comboRenderer(this.Label_cond_combo)
             },{
              id : 'requiredTime',
              header: _('Required Time (hrs)'),
              dataIndex: 'requiredTime',
              sortable: true,
              hideable: false,
              editable: true,
              editor: {
               xtype: 'spinnerfield',
               value: 0,
               maxValue: 10000,
               minValue: 0,
               allowDecimals: true,
               decimalPrecision: 3,
               incrementValue: 0.5,
               alternateIncrementValue: 1.0,
               emptyText: 0
              }
             }]
          }),

          selModel: new Ext.grid.RowSelectionModel({
            singleSelect: false,
            moveEditorOnEnter: false
          }),

          listeners: {
            afteredit: function(e) {
              e.record.commit();
            }
          },

          setEmptyText: function(text){
            if (this.viewReady){
              this.getView().emptyText = text;
              this.getView().refresh();
            } else {
              Ext.apply(this.viewConfig, {emptyText: text});
            }
          },

          loadData: function(data) {
            console.log(data);
            nd = [];
            data.forEach((item, i) => {
             nd.push(item.flat(Infinity));
            });


            this.getStore().loadData(nd);
            if (this.viewReady){
              this.getView().updateHeaders();
            }
          }
        });

        this.tblRules = this.rulesBuilderBox.add({
          child: this.tblRulesConds,
          tblConds: this.tblConds,
          xtype: 'editorgrid',
          margins: '2 0 0 5',
          flex: 1,
          autoExpandColumn: lfn,
          autoSizeColumns: true,

          viewConfig: {
            emptyText: _('Add a rule..'),
            deferEmtpyText: false
          },

          colModel: new Ext.grid.ColumnModel({
            columns: [{
              id: lfn,
              header: _('Label'),
              dataIndex: lfn,
              sortable: true,
              hideable: false,
              editable: false,
              editor: {
                xtype: 'textfield'
                }
              }]
          }),

          selModel: new Ext.grid.RowSelectionModel({
            singleSelect: false,
            moveEditorOnEnter: false
          }),

          store: parentStore,

          // updateConds: function(e){
          //   var selection = this.getSelectionModel().getSelected();
          //   console.log(selection)
          //   console.log(e.record)
          //
          //   new_rec = selection.get('conds');
          //   console.log(new_rec)
          //
          //   // console.log(new_rec);
          //
          //   if (e.record.get('id') in new_rec){
          //    // console.log(e.record);
          //    new_rec[e.record.get('id')] = [e.record.get('conds'), e.record.get('requiredTime')]//[0] = e.value;
          //    console.log(new_rec[e.record.get('id')], new_rec[e.record.get('id')][0], new_rec[e.record.get('id')][1])
          //   } else {
          //
          //    // console.log(this.tblRulesConds.store.getCount());
          //    for (var i = 1; i <= this.tblRulesConds.store.getCount(); i ++){
          //      if (this.tblRulesConds.store.findExact('id', i, 0)  == -1){
          //       e.record.set('id', i)
          //      }
          //    }
          //    new_rec[e.record.get('id')] = [e.record.get('conds'), e.record.get('requiredTime')];
          //   }
          //   // console.log(e.record)
          //   // console.log(new_rec);
          //
          //   // selection.set(e.field, new_rec);
          //   // selection.commit();
          //
          //   // console.log(selection);
          //
          // },
          //
          // updateCondsRemove: function(store, record, index, me){
          //  // console.log(me)
          //
          //  // console.log(record);
          //  var selection = me.getSelectionModel().getSelections()[0];
          //
          //  new_rec = selection.get('conds');
          //  // console.log(new_rec)
          //  delete new_rec[record.get('id')]
          //  // console.log((new_rec));
          //
          // },

          listeners: {
            afteredit: function(e) {
              e.record.commit();
            },
            cellclick: function(grid, rowIndex, colIndex, e){
             record = grid.getStore().getAt(rowIndex);
             linkedData = JSON.parse(JSON.stringify((record.get(grid.getStore().dataFieldName))));
             linkedData.forEach((item, i) => {
              item.unshift(record.get(grid.getStore().linkFieldName))
             });
             grid.child.loadData(linkedData);

             store = grid.tblConds.getStore();
             var data = [];
             for (var i = 0; i < store.getCount(); i ++){
               var record = store.getAt(i);
               name = record.get('name');
               data.push([name, name])
             }
             grid.child.getColumnModel().getColumnById('conditonName').editor.store.loadData(data)
           }
          },

          setEmptyText: function(text){
            if (this.viewReady){
              this.getView().emptyText = text;
              this.getView().refresh();
            } else {
              Ext.apply(this.viewConfig, {emptyText: text});
            }
          },

          loadData: function(data) {
            this.getStore().loadData(data);
            if (this.viewReady){
              this.getView().updateHeaders();
            }
          }
        });

        // this.tblRulesConds.on('afteredit', function(e){this.tblRules.updateConds(e)}, this);
        // this.tblRulesConds.getStore().on('remove', function(a,b,c){this.tblRules.updateCondsRemove(a,b,c,this.tblRules)}, this);
        this.tblRulesConds.parent = this.tblRules;
        this.rulesBuilderBox.add(this.tblRulesConds);


        this.rulesButtonsContainer = this.rulesBuilderBox.add({
          xtype: 'container',
          layout: 'hbox',
          margins: '4 0 0 5',
          items: [{
            xtype: 'button',
            text: 'Add rule',
            margins: '0 5 0 0'
          },{
            xtype: 'button',
            text: 'Remove rule'
          }]
        });

        this.rulesButtonsContainer.getComponent(0).setHandler(function(){this.addLinkedEntry(this.tblRulesConds)}, this);
        this.rulesButtonsContainer.getComponent(1).setHandler(function(){this.removeEntry(this.tblRulesConds)}, this);


        // this.trackerButtonsContainer.getComponent(0).setHandler(this.addTracker, this);
        // this.trackerButtonsContainer.getComponent(1).setHandler(this.deleteTracker, this);

        // this.chkRemove.on('check', this.onClickRemove, this);
        this.chkEnabled.on('check', this.onClickEnabled, this);
        // this.rule1Container.getComponent(0).on('check', this.onClickChkRule1, this);
        // this.rule2Container.getComponent(0).on('check', this.onClickChkRule2, this);

        deluge.preferences.on('show', this.loadPrefs, this);
        deluge.preferences.buttons[1].on('click', this.saveChanges, this);
        deluge.preferences.buttons[2].on('click', this.saveChanges, this);

        this.waitForClient(10);

    },

    addLinkedEntry: function(grid){
     var store = grid.getStore();
     var Entry = store.recordType;
     defaultFields = store.fields.keys;
     newFields = {};
     for (field of defaultFields){
      if (field == grid.parent.getStore().linkFieldName){
       newFields[field] = grid.parent.getSelectionModel().getSelected().get(grid.parent.getStore().linkFieldName);
      } else {
       newFields[field] = '';
      }
     }
     var t = new Entry(newFields)
     grid.stopEditing();
     store.insert(0,t);
     grid.startEditing(0,0);
    },

    addEntry: function(table) {
      var store = table.getStore();
      var Entry = store.recordType;
      defaultFields = store.fields.keys;
      newFields = {};
      for (field of defaultFields){
        newFields[field] = '';
      }
      var t = new Entry(newFields)
      table.stopEditing();
      store.insert(0, t);
      table.startEditing(0, 0);

    },

    removeEntry: function(table) {
      var selections = table.getSelectionModel().getSelections();
      var store = table.getStore();

      table.stopEditing();
        for (var i = 0; i < selections.length; i++)
            store.remove(selections[i]);
        store.commitChanges();
    },

    loadConds: function(conds) {
      // name: [param, conditon, value]
      // var store = this.tblConds.getStore();
      var data = [];
      for (var [name, cond_makeup] of Object.entries(conds)){
        data.push([name,cond_makeup[0],cond_makeup[1],cond_makeup[2]])
      }
      this.tblConds.loadData(data);
    },

    loadRules: function(rules){
      // var data = [];
      // for (var [label, conds] of Object.entries(rules)){
      //   data.push([label,conds])
      // }
      data = Deluge.plugins.autoremoveplusplus.util.dictToArray(rules);
      // console.log(data)
      this.tblRules.loadData(data);
    },


    //TODO destroy
    onDestroy: function() {

        this.un('check', this.onClickEnabled, this);

        deluge.preferences.un('show', this.loadPrefs, this);
        deluge.preferences.buttons[1].un('click', this.saveChanges, this);
        deluge.preferences.buttons[2].un('click', this.saveChanges, this);

        Deluge.plugins.autoremoveplusplus.ui.PreferencePage.superclass.onDestroy.call(this);
    },

    waitForClient: function(triesLeft) {
        if (triesLeft < 1) {
          // this.tblTrackers.setEmptyText(_('Unable to load settings'));
          return;
        }

        if (deluge.login.isVisible() || !deluge.client.core ||
            !deluge.client.autoremoveplusplus) {
          var self = this;
          var t = deluge.login.isVisible() ? triesLeft : triesLeft-1;
          setTimeout(function() { self.waitForClient.apply(self, [t]); }, 1000);
        } else if (!this.isDestroyed) {
          this.loadPrefs();
        }
    },

    enableAllWidgets: function() {
      return

    },

    disableAllWidgets: function() {
      return

    },

    onClickEnabled: function(checkbox, checked) {
        if (checked) {
          this.enableAllWidgets();
        } else {
          this.disableAllWidgets();
          //console.log(checked);
          //console.log('onClickRemove');
        }
    },

    loadPrefs: function() {
        if (deluge.preferences.isVisible()) {
          this._loadPrefs();
          this._loadConds();
          this._loadRules();
        }
    },

    _loadPrefs: function() {
        deluge.client.autoremoveplusplus.get_config({
          success: function(prefs) {
            this.preferences = prefs;

            this.chkEnabled.setValue(this.preferences['enabled'])


          },
          scope: this
        });

        // this._loadConds();

        deluge.client.autoremoveplusplus.get_conds_aliases({
          success: function(conds){
            var data = Deluge.plugins.autoremoveplusplus.util.dictToArray(conds);
            this.param_combo.store.loadData(data);
          },
          scope: this
        });
    },

    _loadConds: function() {
        deluge.client.autoremoveplusplus.get_conds({
          success: function(conds){
            this.conds = conds;
            this.loadConds(conds);
          },
          scope: this
        });
    },

    _loadRules: function() {
      deluge.client.autoremoveplusplus.get_rules({
          success: function(rules){
            this.rules = rules;
            this.loadRules(rules);
          },
          scope: this
        });
    },

    getPrefs: function() {
      preferences = {
        enabled: this.chkEnabled.getValue()
      };

      return preferences
    },

    getConds: function(){
      store = this.tblConds.getStore();

      conds = {};
      for (var i = 0; i < store.getCount(); i ++){
        var record = store.getAt(i);
        name = record.get('name');
        param = record.get('param');
        cond = record.get('cond');
        value = record.get('value');
        conds[name] = [param, cond, value];
      }

      return conds;
    },

    getRules: function(){
      // TODO
      store = this.tblRules.getStore();

      rules = {};
      for (var i = 0; i < store.getCount(); i++){
        var record = store.getAt(i);
        label = record.get(store.linkFieldName);
        cond = record.get(store.dataFieldName);
        // console.log(cond)
        rules[label] = cond;
      }
      console.log(rules)
      return rules;
    },

    saveChanges: function() {

     this.tblRulesConds.loadData([]);


      deluge.client.autoremoveplusplus.save_config(this.getPrefs(), {
        success: this._loadPrefs,
        scope: this
      });



      deluge.client.autoremoveplusplus.save_conds(this.getConds(), {
        success: this._loadConds,
        scope: this
      })
    // TODO


    deluge.client.autoremoveplusplus.save_rules(this.getRules(), {
      success: this._loadRules,
      scope: this
    })
    // rules = this.getRules();

    // console.log(this.rules);
    // console.log(rules);

    // console.log(Deluge.plugins.autoremoveplusplus.util.dictEquals(rules, this.rules));
  }
});

Deluge.plugins.autoremoveplusplus.Plugin = Ext.extend(Deluge.Plugin, {

    name: Deluge.plugins.autoremoveplusplus.PLUGIN_NAME,

    onEnable: function() {
        this.prefsPage = new Deluge.plugins.autoremoveplusplus.ui.PreferencePage();
        deluge.preferences.addPage(this.prefsPage);

        deluge.menus.torrent.add([{
            xtype: 'menucheckitem',
            text: 'AutoRemovePlusPlus Exempt',
            id: 'exempt',

            listeners: {
                checkchange: function(checkitem,checked) {
                    //console.log('Torrent checked...');
                    // console.log(checked);
                    deluge.client.autoremoveplusplus.set_ignore(deluge.torrents.getSelectedIds(),checked);
                }
            }
        }]);

		      deluge.menus.torrent.on('show', this.updateExempt, this);

        console.log('%s enabled', Deluge.plugins.autoremoveplusplus.PLUGIN_NAME);
    },

    onDisable: function() {
        deluge.preferences.selectPage(_('Plugins'));
        deluge.preferences.removePage(this.prefsPage);
        this.prefsPage.destroy();

        deluge.menus.torrent.un('show', this.updateExempt, this);

        console.log('%s disabled', Deluge.plugins.autoremoveplusplus.PLUGIN_NAME);
    },

    //TODO block setChecked signal
    updateExempt: function() {
    	console.log('Updating checkitem...');
    	var checkitem = deluge.menus.torrent.getComponent('exempt');
    	deluge.client.autoremoveplusplus.get_ignore(deluge.torrents.getSelectedIds(), {
            success: function(ignored) {
                var checked = ignored.indexOf(false) < 0;
                checkitem.setChecked(checked);
            },
            scope: this
        });
    }

});

Deluge.registerPlugin(Deluge.plugins.autoremoveplusplus.PLUGIN_NAME,Deluge.plugins.autoremoveplusplus.Plugin);
