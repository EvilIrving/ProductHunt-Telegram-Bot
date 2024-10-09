export class Product {
  constructor(data) {
    this.id = data.id;
    this.name = data.name;
    this.tagline = data.tagline;
    this.description = data.description;
    this.votesCount = data.votesCount;
    this.createdAt = this.convertTime(data.createdAt);
    this.featuredAt = data.featuredAt ? "是" : "否";
    this.website = data.website;
    this.url = data.url;
    this.ogImageUrl = "";
    this.media = data.media;
    this.topics = this.formatTopics(data.topics);
  }

  convertTime(utcTimeStr) {
    return new Date(utcTimeStr).toLocaleString("en-US");
  }

  formatTopics(topicsData) {
    return topicsData.nodes
      .map((node) => `#${node.name.replace(/\s+/g, "_")}`)
      .join(" ");
  }
}
