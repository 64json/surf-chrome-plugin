chrome.extension.sendMessage({ method: 'getWebs' }, webs => {
  const data = (() => {
    const getDomain = url => url.split('/')[2];

    const $most_visited = document.getElementById('most_visited');
    const counts = {};
    Object.values(webs).forEach(web => web.ranks.forEach(rank => {
      if (!counts[rank.web]) counts[rank.web] = 0;
      counts[rank.web] += rank.count;
    }));
    Object.keys(counts).sort((id1, id2) => counts[id2] - counts[id1]).slice(0, 3).forEach(id => {
      const count = counts[id];
      const web = webs[id];
      const li = document.createElement('li');
      li.innerHTML = `<a href="${web.url}"><b>${web.title}</b></a> (${count} times)`;
      $most_visited.appendChild(li);
    });

    const $longest_visited = document.getElementById('longest_visited');
    const durations = {};
    Object.values(webs).forEach(web => web.ranks.forEach(rank => {
      if (!durations[rank.web]) durations[rank.web] = 0;
      durations[rank.web] += rank.duration;
    }));
    Object.keys(durations).sort((id1, id2) => durations[id2] - durations[id1]).slice(0, 3).forEach(id => {
      const duration = durations[id];
      const web = webs[id];
      const li = document.createElement('li');
      li.innerHTML = `<a href="${web.url}"><b>${web.title}</b></a> (${duration / 1000 / 60 | 0} minutes)`;
      $longest_visited.appendChild(li);
    });

    const $most_connected_to = document.getElementById('most_connected_to');
    const connectedTos = {};
    Object.values(webs).forEach(web => web.ranks.forEach(rank => {
      if (!connectedTos[rank.web]) connectedTos[rank.web] = 0;
      connectedTos[rank.web]++;
    }));
    Object.keys(connectedTos).sort((id1, id2) => connectedTos[id2] - connectedTos[id1]).slice(0, 3).forEach(id => {
      const connectedTo = connectedTos[id];
      const web = webs[id];
      const li = document.createElement('li');
      li.innerHTML = `<a href="${web.url}"><b>${web.title}</b></a> (${connectedTo} links)`;
      $most_connected_to.appendChild(li);
    });

    const $most_connected_from = document.getElementById('most_connected_from');
    Object.keys(webs).sort((id1, id2) => webs[id2].ranks.length - webs[id1].ranks.length).slice(0, 3).forEach(id => {
      const web = webs[id];
      const li = document.createElement('li');
      li.innerHTML = `<a href="${web.url}"><b>${web.title}</b></a> (${web.ranks.length} links)`;
      $most_connected_from.appendChild(li);
    });

    const data = Object.values(webs).map(web => {
      return {
        url: getDomain(web.url),
        ranks: web.ranks.map(rank => getDomain(webs[rank.web].url)),
      };
    });

    const indexByName = new Map;
    const nameByIndex = new Map;
    const matrix = [];
    let n = 0;

    function name(url) {
      return url.replace(/https?:\/\//, '');
    }

    data.forEach(d => {
      if (!indexByName.has(d = name(d.url))) {
        nameByIndex.set(n, d);
        indexByName.set(d, n++);
      }
    });

    data.forEach(d => {
      const source = indexByName.get(name(d.url));
      let row = matrix[source];
      if (!row) row = matrix[source] = Array.from({ length: n }).fill(0);
      d.ranks.forEach(d => row[indexByName.get(name(d))]++);
    });

    return {
      matrix,
      indexByName,
      nameByIndex,
    };
  })();

  const width = 964;
  const height = 964;
  const outerRadius = Math.min(width, height) * 0.5;
  const innerRadius = outerRadius - 124;

  const chord = d3.chord()
    .padAngle(.04)
    .sortSubgroups(d3.descending)
    .sortChords(d3.descending);

  const arc = d3.arc()
    .innerRadius(innerRadius)
    .outerRadius(innerRadius + 20);

  const ribbon = d3.ribbon()
    .radius(innerRadius);

  const color = d3.scaleOrdinal(d3.schemeCategory10);

  const svg = d3.select('#chart')
    .attr('viewBox', [-width / 2, -height / 2, width, height])
    .attr('font-size', 10)
    .attr('font-family', 'sans-serif');

  const chords = chord(data.matrix);

  const group = svg.append('g')
    .selectAll('g')
    .data(chords.groups)
    .join('g');

  group.append('path')
    .attr('fill', d => color(d.index))
    .attr('stroke', d => color(d.index))
    .attr('d', arc);

  group.append('text')
    .each(d => {
      d.angle = (d.startAngle + d.endAngle) / 2;
    })
    .attr('dy', '.35em')
    .attr('transform', d => `
        rotate(${(d.angle * 180 / Math.PI - 90)})
        translate(${innerRadius + 26})
        ${d.angle > Math.PI ? 'rotate(180)' : ''}
      `)
    .attr('text-anchor', d => d.angle > Math.PI ? 'end' : null)
    .text(d => data.nameByIndex.get(d.index));

  svg.append('g')
    .attr('fill-opacity', 0.67)
    .selectAll('path')
    .data(chords)
    .join('path')
    .attr('stroke', d => d3.rgb(color(d.source.index)).darker())
    .attr('fill', d => color(d.source.index))
    .attr('d', ribbon);
});
