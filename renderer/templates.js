function _accountTagWithBookAndBrackets({ book, copy, sub, acName }) {
    const left = [book, copy].filter(Boolean).join('-');
    const withSub = sub ? `${left}-${sub}` : left;
    return acName ? `${withSub} <${acName}>` : withSub;
}

function _accountTagWithBookNoBrackets({ book, copy, sub, acName }) {
    const left = [book, copy].filter(Boolean).join('-');
    const withSub = sub ? `${left}-${sub}` : left;
    return acName ? `${withSub} ${acName}` : withSub;
}

function _accountTagNoBook({ copy, sub, acName }) {
    const left = sub ? `${copy}-${sub}` : copy;
    return acName ? `${left} ${acName}` : left;
}

function callDepositPlace(ctx) {
    const subject = `Call Deposit Order - ${PoseidonCommon.formatDateForSubject()}`;
    const body =
        `Hi Team,\n\n` +
        `For a/c ${_accountTagWithBookAndBrackets(ctx)},\n\n` +
        `Please help place ${ctx.ccy} Call Deposit, amount: ${ctx.ccy} ${ctx.amount}. Value ${ctx.valueLabel || 'Today'}.`;
    return { subject, body };
}

function callDepositUnwind(ctx) {
    const subject = `Unwind Call Deposit Order - ${PoseidonCommon.formatDateForSubject()}`;
    const body =
        `Hi Team,\n\n` +
        `For a/c ${_accountTagWithBookAndBrackets(ctx)},\n\n` +
        `Please help unwind the ${ctx.ccy} Call Deposit, amount: ${ctx.ccy} ${ctx.amount}. Value ${ctx.valueLabel || 'Today'}. Thanks.`;
    return { subject, body };
}

function ftdDeposit(ctx) {
    const subject = `Deposit Order - ${PoseidonCommon.formatDateForSubject()}`;
    const at = ctx.bookingEntity ? ` at ${ctx.bookingEntity}` : '';
    const lines = [
        `Hi Team,`,
        '',
        `For a/c ${_accountTagWithBookNoBrackets(ctx)}`,
        '',
        `Please help us with ${ctx.ccy} deposit order${at} below:`,
        `Tenor: ${ctx.tenor}`,
        `Amount: ${ctx.ccy} ${ctx.amount}`,
    ];
    if (ctx.rate) lines.push(`Rate to client: ${ctx.rate}%`);
    if (ctx.spread) lines.push(`Spread: ${ctx.spread} bps`);
    lines.push(`Value ${ctx.valueLabel || 'Today'}`);
    lines.push('');
    lines.push('Many thanks.');
    return { subject, body: lines.join('\n') };
}

function oneOffLoan(ctx) {
    const subject = `Loan Instruction Order - ${PoseidonCommon.formatDateForSubject()}`;
    const body =
        `Hi Team,\n\n` +
        `For a/c ${_accountTagNoBook(ctx)},\n\n` +
        `Please help draw one-off ${ctx.ccy} loan ${ctx.ccy} ${ctx.amount} ${ctx.purpose || 'to cover OD'}, til ${ctx.endDate}, starting from ${ctx.startLabel || 'today'}. Many thanks`;
    return { subject, body };
}

function siLoan(ctx) {
    const subject = `SI Loan Instruction Order - ${PoseidonCommon.formatDateForSubject()}`;
    const rolling = ctx.rolling || 'weekly';
    const instr = ctx.loanInstruction || '';
    const tail = instr ? `${instr}, ` : '';
    const body =
        `Hi Team,\n\n` +
        `For a/c ${_accountTagNoBook(ctx)},\n\n` +
        `Please help draw ${ctx.ccy} loan ${ctx.ccy} ${ctx.amount} ${ctx.purpose || 'to cover OD'}, rolling on a ${rolling} basis, ${tail}starting from ${ctx.startLabel || 'today'}. Many thanks`;
    return { subject, body };
}

function _equityOrderBlock(o) {
    const action = o.action === 'sell' ? 'Sell' : 'Buy';
    const lines = [`${action} ${o.symbol}`, `Quantity: ${o.quantity} shares`];
    if (o.orderType === 'limit') {
        lines.push(`At limit price: ${o.limitPrice}`);
        lines.push(o.tif === 'gtd' && o.gtdDate ? `Good Till ${o.gtdDate}` : 'Day order');
    } else if (o.orderType === 'vwap') {
        if (o.vwapType === 'limit' && o.vwapLimit) {
            lines.push('VWAP Limit');
            lines.push(`Limit Price: ${o.vwapLimit}`);
        } else if (o.vwapType === 'window' && o.vwapWindow) {
            lines.push(`VWAP, ${o.vwapWindow}`);
        } else {
            lines.push('Day VWAP');
        }
    } else {
        lines.push('At market price');
    }
    return lines;
}

function equityOrder(ctx) {
    // ctx.orders: array of per-order objects.
    // Backward-compat: if ctx has no `orders` array, wrap the single ctx as one order.
    const orders = Array.isArray(ctx.orders) ? ctx.orders : [{
        action: ctx.action, symbol: ctx.symbol, quantity: ctx.quantity,
        orderType: ctx.orderType, limitPrice: ctx.limitPrice, tif: ctx.tif, gtdDate: ctx.gtdDate,
        vwapType: ctx.vwapType, vwapLimit: ctx.vwapLimit, vwapWindow: ctx.vwapWindow,
    }];
    const multi = orders.length > 1;
    const subject = `Equity Order${multi ? 's' : ''} - ${PoseidonCommon.formatDateForSubject()}`;
    const lines = [
        `Hi Team,`,
        '',
        `For a/c ${_accountTagNoBook(ctx)},`,
        '',
        `Please help place ${multi ? 'orders' : 'order'} below.`,
    ];
    orders.forEach((o, idx) => {
        lines.push('');
        if (multi) lines.push(`**Equity Order ${idx + 1}**`);
        lines.push(..._equityOrderBlock(o));
    });
    return { subject, body: lines.join('\n') };
}

window.PoseidonTemplates = { callDepositPlace, callDepositUnwind, ftdDeposit, oneOffLoan, siLoan, equityOrder };
