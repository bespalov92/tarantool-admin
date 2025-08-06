Ext.define('Admin.Database.Query', {

  extend: 'Ext.panel.Panel',
  title: 'Query',
  iconCls: 'fa fa-code',
  border: false,

  layout: {
    type: 'vbox',
    align: 'stretch',
  },

  listeners: {
    single: true,
    afterlayout() {
      this.down('textarea').focus();
    },
  },

  items: [ {
    tbar: {
      height: 36,
      items: [ {
        xtype: 'label',
        text: 'Type your query below',
      } ],
    },
    style: {
      marginLeft: '8px',
      marginRight: '8px',
    },
    layout: 'fit',
    items: [ {
      xtype: 'textarea',
      value: 'return box.space._space:select()',
      cls: 'query-textarea',
      grow: true,
      flex: 1,
      maxHeight: 300,
      inputAttrTpl: 'spellcheck="false"',
      listeners: {
        specialkey(f, e) {
          if (e.keyCode == 13 && e.ctrlKey) {
            f.up('database-query')
              .down('[text=Execute]')
              .handler();
          }
        },
      },
    } ],
  }, {
    bodyPadding: 10,
    flex: 1,
    layout: 'fit',
    name: 'result',
    showResult(script, result) {
      var returns = (script.split('return ')[1] || '').split(',').map(v => v.trim());

      this.removeAll();
      var stats = 'Your query takes ' + Ext.util.Format.number(result.timing, '0.0') + ' ms';

      this.up('[title=Query]')
        .down('[name=execution]')
        .setText(stats);

      this.add(Ext.create('Ext.tab.Panel', {
        layout: 'fit',
        items: result.result.map((element, i) => {
          var item = {
            title: returns.length == result.result.length ? returns[i] : i+1,
            layout: 'fit',
          };

          if (Ext.isArray(element) && Ext.isArray(element[0]) && !Ext.isArray(element[0][0])) {
            item.xtype = 'grid';
            item.columns = [];
            var tupleLength = Ext.Array.max(element.map(row => row.length));

            for (var j=1; j <= tupleLength; j++) {
              item.columns.push({
                dataIndex: 'f' + j,
                header: j,
                autoSize: true,
                renderer(v) {
                  if (Ext.isObject(v)) {
                    return Ext.JSON.encode(v);
                  }

                  if (Ext.isArray(v) && v.length && (Ext.isArray(v[0]) || Ext.isObject(v[0]))) {
                    return Ext.JSON.encode(v);
                  }

                  return v;
                },
              });
            }

            item.store = {
              fields: item.columns.map(c => c.dataIndex),
              data: element,
            };
          }
          else {
            var getChildren = function(object) {
              return Ext.Object.getKeys(object)
                .sort()
                .map(key => {
                  var node = {
                    key: key,
                    value: object[key],
                  };

                  if (Ext.isObject(node.value)) {
                    node.children = getChildren(node.value);
                    node.value = '...';
                  }
                  else {
                    node.leaf = true;
                  }

                  return node;
                });
            };

            Ext.apply(item, {
              xtype: 'treepanel',
              rootVisible: false,
              root: {
                text: 'root',
                expanded: true,
                children: getChildren(element),
              },
              columns: [ {
                text: 'Key',
                dataIndex: 'key',
                width: 200,
                xtype: 'treecolumn',
              }, {
                text: 'Value',
                flex: 1,
                dataIndex: 'value',
              } ],
            });
          }

          return item;
        }),
      }));
    },
    tbar: [ {
      text: 'Execute',
      iconCls: 'fa fa-play',
      handler() {
        var script = this.up('database-query')
          .down('textarea')
          .getValue();

        dispatch('database.execute', Ext.apply({ code: script }, this.up('database-tab').params))
          .then(result => {
            this.up('database-query')
              .down('[name=result]')
              .showResult(script, result);
          });
      },
    }, '->', {
      xtype: 'label',
      name: 'execution',
    } ],
  } ],
});
