FROM alpine:3.20 AS downloader
ARG PB_VERSION=0.40.4
ARG TARGETARCH
RUN apk add --no-cache curl unzip ca-certificates && \
    ARCH=$([ "$TARGETARCH" = "arm64" ] && echo "arm64" || echo "amd64") && \
    curl -sL "https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_${ARCH}.zip" -o /tmp/pb.zip && \
    unzip -q /tmp/pb.zip -d /pb && \
    rm /tmp/pb.zip

FROM alpine:3.20
RUN apk add --no-cache ca-certificates
COPY --from=downloader /pb/pocketbase /usr/local/bin/pocketbase

WORKDIR /pb
COPY pb_migrations ./pb_migrations
COPY pb_hooks ./pb_hooks
COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

EXPOSE 8090
VOLUME ["/pb/pb_data"]

ENTRYPOINT ["docker-entrypoint.sh"]
