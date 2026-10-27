pm.test("status 200", function () {
  pm.response.to.have.status(200);
});

const body = pm.response.json();

pm.test("envelope", function () {
  pm.expect(body.status).to.eql(200);
  pm.expect(body.message).to.eql("생활비 계산에 성공했습니다.");
  pm.expect(body.result).to.be.an("object");
});

pm.test("명세 예시와 동일", function () {
  const r = body.result;
  pm.expect(r.seoul.monthly_remaining).to.eql(120);
  pm.expect(r.busan.living).to.eql(94.9);
  pm.expect(r.busan.monthly_remaining).to.eql(105.1);
  pm.expect(r.monthly_difference).to.eql(-14.9);
  pm.expect(r.annual_difference).to.eql(-178.8);
  pm.expect(r.largest_difference.items).to.eql(["pay"]);
  pm.expect(r.living_ratio).to.eql(0.949);
  pm.expect(r.unit).to.eql("만원");
});
