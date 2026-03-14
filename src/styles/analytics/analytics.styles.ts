import { StyleSheet } from "react-native";

export const stylesAnalytics = StyleSheet.create({
    container: {
        flex: 1,
        padding: 24,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: 40,
        marginBottom: 24,
    },
    header: {
        fontSize: 28,
        fontWeight: 'bold',
    },
    subTitle: {
        fontSize: 14,
        color: '#888',
        marginTop: 2,
    },
    summaryContainer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 32,
        gap: 8,
    },
    summaryCard: {
        flex: 1,
        padding: 16,
        borderRadius: 16,
        alignItems: 'center',
        borderWidth: 1,
    },
    summaryValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    summaryLabel: {
        fontSize: 10,
        color: '#888',
        marginTop: 4,
        textTransform: 'uppercase',
        fontWeight: '600',
    },
    mapCard: {
        height: 200,
        marginBottom: 32,
        borderRadius: 16,
        overflow: 'hidden',
        borderWidth: 1,
    },
    mapTitle: {
        padding: 12,
        fontSize: 14,
        fontWeight: '700',
    },
    map: {
        flex: 1,
    },
    metricsGrid: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
    },
    miniMetric: {
        flex: 1,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        borderWidth: 1,
    },
    miniValue: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    miniLabel: {
        fontSize: 10,
        color: '#888',
    },
    chartCard: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 32,
        borderWidth: 1,
    },
    chartContent: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        height: 100,
        justifyContent: 'space-between',
    },
    chartCol: {
        flex: 1,
        alignItems: 'center',
        height: '100%',
        justifyContent: 'flex-end',
    },
    chartBar: {
        width: '60%',
        borderRadius: 4,
    },
    chartLabelText: {
        fontSize: 8,
        color: '#999',
        marginTop: 4,
        position: 'absolute',
        bottom: -15,
    },
    subHeader: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    card: {
        padding: 16,
        borderRadius: 16,
        marginBottom: 12,
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
    },
    cardLeft: {
        flex: 1,
    },
    dayBadge: {
        alignSelf: 'flex-start',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 8,
        marginBottom: 6,
    },
    dateText: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statLabel: {
        fontSize: 12,
        color: '#888',
    },
    cardRight: {
        alignItems: 'flex-end',
    },
    statValue: {
        fontSize: 18,
        fontWeight: 'bold',
    },
    perfTime: {
        fontSize: 14,
        fontWeight: '600',
        marginBottom: 2,
    },
    timeLabel: {
        fontSize: 12,
        color: '#888',
        marginTop: 2,
        flexDirection: 'row',
        alignItems: 'center',
    },
    syncContainer: {
        marginTop: 24,
        marginBottom: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    syncText: {
        color: '#aaa',
        fontSize: 12,
    }
});

export const mapDarkStyle = [
    {
        "elementType": "geometry",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#746855" }]
    },
    {
        "elementType": "labels.text.stroke",
        "stylers": [{ "color": "#242f3e" }]
    },
    {
        "featureType": "administrative.locality",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "poi",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#d59563" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry",
        "stylers": [{ "color": "#38414e" }]
    },
    {
        "featureType": "road",
        "elementType": "geometry.stroke",
        "stylers": [{ "color": "#212a37" }]
    },
    {
        "featureType": "road",
        "elementType": "labels.text.fill",
        "stylers": [{ "color": "#9ca5b3" }]
    },
    {
        "featureType": "water",
        "elementType": "geometry",
        "stylers": [{ "color": "#17263c" }]
    }
];