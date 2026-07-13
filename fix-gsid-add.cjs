const fs=require('fs'),p=require('path'),F=p.join(__dirname,'index.html');
let f=fs.readFileSync(F,'utf8'),c=0;

// 1. Add gsId to form initial state
f=f.replace('badge: "",\n      dept:','badge: "",\n      gsId: "",\n      dept:');
c++;console.log('OK 1-form init');

// 2. Add gsId to addEmp output
f=f.replace('badge: form.badge || genBadge(),','badge: form.badge || genBadge(),\n      gsId: form.gsId || "",');
c++;console.log('OK 2-addEmp output');

// 3. Add GS ID field after BADGE field in form
f=f.replace(
  'placeholder: "Auto",\n    style: inp\n  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label",',
  'placeholder: "Auto",\n    style: inp\n  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", {\n    style: {\n      fontSize: 13,\n      fontWeight: 600,\n      color: C.t4,\n      fontFamily: Fb,\n      letterSpacing: 1.5,\n      display: "block",\n      marginBottom: 3\n    }\n  }, "GS ID"), /*#__PURE__*/React.createElement("input", {\n    value: form.gsId,\n    onChange: function (e) {\n      setForm(function (f) {\n        return Object.assign({}, f, {\n          gsId: e.target.value\n        });\n      });\n    },\n    placeholder: "Greenshades ID",\n    style: inp\n  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label",'
);
c++;console.log('OK 3-form UI field');

fs.writeFileSync(F,f,'utf8');
console.log('DONE: '+c);
