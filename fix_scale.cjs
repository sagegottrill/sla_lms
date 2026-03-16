const fs = require('fs');

const replacements = [
  { f: 'src/pages/PlacementTrackingPage.tsx', r: [ [/[\'\"]₦55K[\'\"]/g, '\'₦18M/yr\''], [/[\'\"]₦48K[\'\"]/g, '\'₦15M/yr\''], [/[\'\"]₦45K[\'\"]/g, '\'₦12M/yr\''], [/[\'\"]₦40K[\'\"]/g, '\'₦10M/yr\''] ] },
  { f: 'src/pages/LeadDashboardPage.tsx', r: [ [/[\'\"]₦48,200[\'\"]/g, '\'₦48.2M\''] ] },
  { f: 'src/pages/JobBoardPage.tsx', r: [ [/[\'\"]₦50K–70K[\'\"]/g, '\'₦15M–25M/yr\''], [/[\'\"]₦45K–65K[\'\"]/g, '\'₦12M–20M/yr\''], [/[\'\"]₦35K–50K[\'\"]/g, '\'₦10M–15M/yr\''], [/[\'\"]₦40K–55K[\'\"]/g, '\'₦12M–18M/yr\''], [/[\'\"]₦60K–85K[\'\"]/g, '\'₦20M–30M/yr\''], [/[\'\"]₦15K–20K[\'\"]/g, '\'₦3M–5M/yr\''] ] },
  { f: 'src/pages/IncomeProgressionPage.tsx', r: [ [/[\'\"]Target: ₦300,000\/month income[\'\"]/g, '\'Target: ₦2.5M/month income\''], [/[\'\"]₦80k[\'\"]/g, '\'₦250k\''], [/[\'\"]₦185k[\'\"]/g, '\'₦1.5M\''], [/[\'\"]₦120k[\'\"]/g, '\'₦400k\''], [/[\'\"]₦220k[\'\"]/g, '\'₦1.8M\''], [/[\'\"]₦60k[\'\"]/g, '\'₦150k\''], [/[\'\"]₦150k[\'\"]/g, '\'₦1.2M\''], [/[\'\"]₦90k[\'\"]/g, '\'₦300k\''], [/[\'\"]₦210,000[\'\"]/g, '\'₦1,500,000\''] ] },
  { f: 'src/pages/ForTeamsPage.tsx', r: [ [/[\'\"]₦499[\'\"]/g, '\'₦500,000\''], [/[\'\"]₦999[\'\"]/g, '\'₦1,000,000\''] ] },
  { f: 'src/pages/EmployerPortalPage.tsx', r: [ [/[\'\"]₦1,200–₦1,800\/mo[\'\"]/g, '\'₦600k–₦1.2M/mo\''], [/[\'\"]₦2,000–₦3,000\/mo[\'\"]/g, '\'₦1.5M–₦2.5M/mo\''], [/[\'\"]₦1,500–₦2,200\/mo[\'\"]/g, '\'₦800k–₦1.5M/mo\''], [/[\'\"]₦900–₦1,400\/mo[\'\"]/g, '\'₦500k–₦900k/mo\''], [/[\'\"]₦800–₦1,200\/mo[\'\"]/g, '\'₦400k–₦800k/mo\''] ] },
  { f: 'src/pages/EarningsPage.tsx', r: [ [/>₦3,200</g, '>₦3,200,000<'], [/>₦1,500</g, '>₦200,000<'], [/>₦5\.00</g, '>₦5,000<'] ] },
  { f: 'src/pages/dashboards/InstructorDashboard.tsx', r: [ [/[\'\"]₦17,660[\'\"]/g, '\'₦17.6M\''], [/>₦2,340 /g, '>₦2,340,000 '] ] },
  { f: 'src/pages/dashboards/AdminDashboard.tsx', r: [ [/[\'\"]₦84,320[\'\"]/g, '\'₦84.3M\''], [/[\'\"]₦72,100[\'\"]/g, '\'₦72.1M\''], [/[\'\"]₦840K[\'\"]/g, '\'₦840M\''] ] },
  { f: 'src/pages/CourseCatalogPage.tsx', r: [ [/[\'\"]Under ₦50[\'\"]/g, '\'Under ₦50,000\''], [/[\'\"]₦50–₦100[\'\"]/g, '\'₦50,000–₦100,000\''], [/[\'\"]Over ₦100[\'\"]/g, '\'Over ₦100,000\''], [/< 50/g, '< 50000'], [/>= 50/g, '>= 50000'], [/< 100/g, '< 100000'], [/> 100/g, '> 100000'], [/>= 100/g, '>= 100000'], [/> 50/g, '> 50000'], [/>= -100/g, '>= -100'] ] }
];

replacements.forEach(({f, r}) => {
  if (fs.existsSync(f)) {
    let content = fs.readFileSync(f, 'utf8');
    let changed = false;
    r.forEach(([find, repl]) => {
      let nextContent = content.replace(find, repl);
      if (nextContent !== content) changed = true;
      content = nextContent;
    });
    if (changed) {
      fs.writeFileSync(f, content, 'utf8');
      console.log('Fixed ' + f);
    }
  }
});

let p = 'src/pages/PaymentsPage.tsx';
if (fs.existsSync(p)) {
  let c = fs.readFileSync(p, 'utf8');
  let newC = c.replace(/amount: (\d+)/g, (match, p1) => {
    let amt = parseInt(p1);
    if (amt < 1000) {
      if (amt === 499) return 'amount: 500000';
      if (amt === 999) return 'amount: 1000000';
      if (amt === 89) return 'amount: 85000';
      if (amt === 119) return 'amount: 120000';
      if (amt === 299) return 'amount: 300000';
      if (amt === 59) return 'amount: 60000';
      return 'amount: ' + (amt * 1000);
    }
    return match;
  });
  if (newC !== c) {
    fs.writeFileSync(p, newC, 'utf8');
    console.log('Fixed ' + p);
  }
}
console.log('Done');
