const err = { detail: [{loc: ["body", "budget"], msg: "field required" }, {loc: ["body", "something"], msg: "field required" }] };
const msg = err.detail || "Failed";
try {
    throw new Error(msg);
} catch (e) {
    console.log(e.message);
}
